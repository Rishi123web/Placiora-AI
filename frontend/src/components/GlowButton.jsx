function GlowButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  variant = "primary",
  className = ""
}) {
  const variants = {
    primary: "from-cyan-500 to-blue-700",
    purple: "from-purple-500 to-pink-700",
    green: "from-emerald-500 to-green-700",
    orange: "from-orange-500 to-red-700"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`glow-button px-6 py-3 rounded-2xl bg-gradient-to-r ${
        variants[variant] || variants.primary
      } text-white font-semibold disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}

export default GlowButton