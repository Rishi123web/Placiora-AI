import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import User from "../models/User.js"

const router = express.Router()

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route working"
  })
})

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local"
    })

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" }
    )

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.log("Register Error:", error)

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      })
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google login. Please continue with Google."
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" }
    )

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.log("Login Error:", error)

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    })
  }
})

export default router