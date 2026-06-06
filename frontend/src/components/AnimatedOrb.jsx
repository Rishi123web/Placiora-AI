function AnimatedOrb() {
  return (
    <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-700 blur-2xl opacity-80 animate-pulse" />
      <div className="absolute inset-2 rounded-full border border-cyan-300/40 shadow-[0_0_70px_rgba(34,211,238,0.4)]" />

      <div className="relative w-[88%] h-[88%] rounded-full overflow-hidden border border-white/20 bg-slate-900">
        <video
          src="/prep-ai-animation.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

export default AnimatedOrb