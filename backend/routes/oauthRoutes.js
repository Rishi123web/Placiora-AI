import express from "express"
import passport from "passport"
import jwt from "jsonwebtoken"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"

import User from "../models/User.js"

const router = express.Router()

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5173"

const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/oauth/google/callback"

let googleStrategyRegistered = false

const getGoogleConfig = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

  return {
    clientID,
    clientSecret,
    ready: Boolean(clientID && clientSecret)
  }
}

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET || "prep_ai_secret_key",
    { expiresIn: "7d" }
  )
}

const findOrCreateUser = async ({ name, email }) => {
  if (!email) {
    throw new Error("Google account email not found")
  }

  let user = await User.findOne({ email })

  if (!user) {
    user = await User.create({
      name: name || "Google User",
      email,
      password: `google_oauth_${Date.now()}`,
      provider: "google"
    })
  }

  return user
}

const registerGoogleStrategy = () => {
  const { clientID, clientSecret, ready } = getGoogleConfig()

  if (!ready) return false
  if (googleStrategyRegistered) return true

  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value

          const user = await findOrCreateUser({
            name: profile.displayName || "Google User",
            email
          })

          return done(null, user)
        } catch (error) {
          return done(error, null)
        }
      }
    )
  )

  googleStrategyRegistered = true
  console.log("Google Strategy Registered")
  console.log("Google Callback URL:", GOOGLE_CALLBACK_URL)

  return true
}

router.get("/test", (req, res) => {
  const config = getGoogleConfig()

  res.json({
    success: true,
    message: "Google OAuth route working",
    googleLoaded: config.ready,
    strategyRegistered: googleStrategyRegistered,
    callbackUrl: GOOGLE_CALLBACK_URL,
    frontendUrl: FRONTEND_URL,
    clientIdExists: Boolean(config.clientID),
    secretExists: Boolean(config.clientSecret)
  })
})

router.get("/google", (req, res, next) => {
  const isRegistered = registerGoogleStrategy()

  if (!isRegistered) {
    return res.status(500).json({
      success: false,
      message: "Google OAuth credentials missing"
    })
  }

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account"
  })(req, res, next)
})

router.get("/google/callback", (req, res, next) => {
  const isRegistered = registerGoogleStrategy()

  if (!isRegistered) {
    return res.redirect(`${FRONTEND_URL}/login`)
  }

  return passport.authenticate(
    "google",
    {
      session: false,
      failureRedirect: `${FRONTEND_URL}/login`
    },
    (error, user) => {
      if (error || !user) {
        console.log("Google OAuth Callback Error:", error?.message)
        return res.redirect(`${FRONTEND_URL}/login`)
      }

      const token = createToken(user)

      const safeUser = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        provider: "google"
      }

      return res.redirect(
        `${FRONTEND_URL}/oauth-success?token=${token}&user=${encodeURIComponent(
          JSON.stringify(safeUser)
        )}`
      )
    }
  )(req, res, next)
})

export default router