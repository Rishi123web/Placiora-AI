import { Canvas, useFrame } from "@react-three/fiber"
import { Float, OrbitControls } from "@react-three/drei"
import { useRef } from "react"

function RobotAvatar({
  speaking = false,
  listening = false,
  thinking = false,
  agentMode = false
}) {
  const groupRef = useRef(null)
  const headRef = useRef(null)
  const mouthRef = useRef(null)
  const ringRef = useRef(null)
  const ring2Ref = useRef(null)
  const ring3Ref = useRef(null)
  const ring4Ref = useRef(null)
  const glowRef = useRef(null)
  const auraRef = useRef(null)
  const scannerRef = useRef(null)
  const eyeLRef = useRef(null)
  const eyeRRef = useRef(null)
  const coreRef = useRef(null)

  const color = listening
    ? "#fb7185"
    : thinking
    ? "#c084fc"
    : speaking
    ? "#67e8f9"
    : agentMode
    ? "#a78bfa"
    : "#38bdf8"

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.9) * 0.22
      groupRef.current.rotation.x = Math.sin(t * 0.7) * 0.045
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.06
    }

    if (headRef.current) {
      headRef.current.rotation.z = speaking ? Math.sin(t * 4) * 0.028 : 0
    }

    if (mouthRef.current) {
      mouthRef.current.scale.y = speaking
        ? 0.65 + Math.abs(Math.sin(t * 18)) * 2.4
        : 0.7
    }

    if (ringRef.current) ringRef.current.rotation.z += listening ? 0.052 : 0.036
    if (ring2Ref.current) ring2Ref.current.rotation.z -= thinking ? 0.04 : 0.025
    if (ring3Ref.current) ring3Ref.current.rotation.y += agentMode ? 0.032 : 0.018
    if (ring4Ref.current) {
      ring4Ref.current.rotation.x += 0.012
      ring4Ref.current.rotation.z -= 0.018
    }

    if (scannerRef.current) {
      scannerRef.current.position.y = Math.sin(t * 5.2) * 0.34
      scannerRef.current.material.opacity = 0.55 + Math.sin(t * 7) * 0.35
    }

    if (glowRef.current) {
      const pulse = 1.08 + Math.sin(t * 3.4) * 0.1
      glowRef.current.scale.set(pulse, pulse, pulse)
      glowRef.current.material.color.set(color)
    }

    if (auraRef.current) {
      const pulse = 1.02 + Math.sin(t * 2.2) * 0.06
      auraRef.current.scale.set(pulse, pulse, pulse)
      auraRef.current.material.color.set(color)
    }

    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 6) * 0.14
      coreRef.current.scale.set(pulse, pulse, pulse)
    }

    if (eyeLRef.current && eyeRRef.current) {
      const blink = Math.sin(t * 4.2) > 0.96 ? 0.15 : 1
      eyeLRef.current.scale.y = blink
      eyeRRef.current.scale.y = blink
    }
  })

  return (
    <group scale={1.15}>
      <mesh ref={auraRef}>
        <sphereGeometry args={[2.05, 64, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[1.75, 64, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>

      <mesh ref={coreRef}>
        <sphereGeometry args={[1.05, 48, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.026, 24, 160]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={5}
          transparent
          opacity={1}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 2.2, 0.4, 0]}>
        <torusGeometry args={[1.28, 0.014, 24, 160]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={4}
          transparent
          opacity={0.75}
        />
      </mesh>

      <mesh ref={ring3Ref} rotation={[0.45, 0, 0]}>
        <torusGeometry args={[1.42, 0.011, 24, 160]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={3}
          transparent
          opacity={0.6}
        />
      </mesh>

      <mesh ref={ring4Ref} rotation={[0.95, 0.4, 0.2]}>
        <torusGeometry args={[1.58, 0.008, 24, 180]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={2.6}
          transparent
          opacity={0.45}
        />
      </mesh>

      <group ref={groupRef}>
        <group ref={headRef}>
          <mesh>
            <boxGeometry args={[1.18, 1.02, 0.76]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.96}
              roughness={0.12}
              emissive={color}
              emissiveIntensity={0.65}
            />
          </mesh>

          <mesh position={[0, 0.09, 0.42]}>
            <boxGeometry args={[0.94, 0.5, 0.055]} />
            <meshStandardMaterial
              color="#020617"
              emissive="#22d3ee"
              emissiveIntensity={1.6}
              transparent
              opacity={0.96}
            />
          </mesh>

          <mesh ref={eyeLRef} position={[-0.25, 0.17, 0.48]}>
            <boxGeometry args={[0.18, 0.085, 0.045]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#67e8f9"
              emissiveIntensity={6}
            />
          </mesh>

          <mesh ref={eyeRRef} position={[0.25, 0.17, 0.48]}>
            <boxGeometry args={[0.18, 0.085, 0.045]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#67e8f9"
              emissiveIntensity={6}
            />
          </mesh>

          <mesh ref={scannerRef} position={[0, 0, 0.5]}>
            <boxGeometry args={[0.82, 0.02, 0.038]} />
            <meshStandardMaterial
              color="#67e8f9"
              emissive="#67e8f9"
              emissiveIntensity={6}
              transparent
              opacity={1}
            />
          </mesh>

          <mesh ref={mouthRef} position={[0, -0.25, 0.5]}>
            <boxGeometry args={[0.42, 0.04, 0.035]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#67e8f9"
              emissiveIntensity={4.5}
            />
          </mesh>

          <mesh position={[-0.72, 0.05, 0]}>
            <sphereGeometry args={[0.17, 24, 24]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.95}
              roughness={0.16}
              emissive={color}
              emissiveIntensity={0.45}
            />
          </mesh>

          <mesh position={[0.72, 0.05, 0]}>
            <sphereGeometry args={[0.17, 24, 24]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.95}
              roughness={0.16}
              emissive={color}
              emissiveIntensity={0.45}
            />
          </mesh>

          <mesh position={[0, -0.72, 0]} scale={[0.9, 0.34, 0.66]}>
            <sphereGeometry args={[0.55, 32, 32]} />
            <meshStandardMaterial
              color="#111827"
              metalness={0.95}
              roughness={0.16}
              emissive={color}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Avatar3D({
  speaking = false,
  listening = false,
  thinking = false,
  agentMode = false,
  compact = false
}) {
  return (
    <div className="w-full h-full avatar-entry">
      <Canvas
        camera={{
          position: [0, 0, compact ? 4.8 : 4.2],
          fov: compact ? 38 : 42
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.35} />

        <pointLight position={[2, 3, 4]} intensity={5.2} color="#22d3ee" />
        <pointLight position={[-2, -2, 3]} intensity={3.8} color="#8b5cf6" />
        <pointLight position={[0, 0, 2]} intensity={2.6} color="#67e8f9" />
        <pointLight position={[0, 2, 1]} intensity={1.8} color="#ffffff" />

        <Float speed={2.9} rotationIntensity={0.7} floatIntensity={1.35}>
          <RobotAvatar
            speaking={speaking}
            listening={listening}
            thinking={thinking}
            agentMode={agentMode}
          />
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          enableDamping
        />
      </Canvas>
    </div>
  )
}

export default Avatar3D