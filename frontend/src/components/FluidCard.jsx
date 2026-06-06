function FluidCard({ children, className = "", onClick }) {
  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()

    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`glow-card rounded-[2rem] p-6 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default FluidCard