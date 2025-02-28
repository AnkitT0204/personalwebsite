import { Canvas } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const FlyingObject = () => {
  const meshRef = useRef()
  const direction = useRef(new THREE.Vector3(1, 0, 0))

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.add(direction.current.clone().multiplyScalar(delta * 10))
      
      // Boundary check
      if (meshRef.current.position.x > 15) direction.current.set(-1, 0, 0)
      if (meshRef.current.position.x < -15) direction.current.set(1, 0, 0)
      
      // Rotate object
      meshRef.current.rotation.x += delta
      meshRef.current.rotation.y += delta
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial 
        color="#00ff00" 
        emissive="#00ff00"
        emissiveIntensity={2}
        metalness={0.5}
      />
    </mesh>
  )
}

const SpaceBackground = () => {
  return (
    <Canvas className="fixed top-0 left-0 w-full h-full -z-10">
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
      />
      <FlyingObject />
      <OrbitControls enableZoom={false} />
    </Canvas>
  )
}

export default SpaceBackground