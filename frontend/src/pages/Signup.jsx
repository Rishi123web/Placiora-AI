import { useState } from "react"
import axios from "axios"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, User, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import API_BASE from "../config/api"

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleGoogleSignup = () => {
    setGoogleLoading(true)
    window.location.href = `${API_BASE}/api/oauth/google`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`${API_BASE}/api/auth/register`, form)
      alert("Signup successful")
      navigate("/login")
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 z-0"
      >
        <source src="/auth-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-black/80 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-6 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -12, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex justify-center items-center"
          >
            <div className="absolute w-72 h-72 rounded-full bg-cyan-400/10 blur-[80px]" />
            <div className="absolute w-64 h-64 rounded-full border border-cyan-400/20 shadow-[0_0_60px_rgba(34,211,238,0.45)]" />

            <img
              src="/prep-logo.png"
              alt="Placiora AI Logo"
              className="relative z-10 w-64 h-64 object-contain logo-bloom"
            />
          </motion.div>

          <h1 className="text-4xl font-black mb-2 text-white text-glow">
            Join Placiora AI
          </h1>

          <p className="text-slate-400">
            Start your placement journey with
          </p>

          <p className="mt-2 text-cyan-300 font-semibold">
            Your Personal Placement Copilot
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full mb-5 bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70"
          >
            <GoogleIcon />
            {googleLoading ? "Opening Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500 uppercase tracking-[0.2em]">
              or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-5">
            <Input
              icon={User}
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
            />

            <Input
              icon={Mail}
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />

            <Input
              icon={Lock}
              label="Password"
              name="password"
              type="password"
              placeholder="Create password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70"
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="mt-6 text-center text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

function Input({ icon: Icon, label, ...props }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-2 block">{label}</label>

      <div className="relative">
        <Icon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          size={18}
        />

        <input
          {...props}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 outline-none focus:border-blue-500"
        />
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

export default Signup
