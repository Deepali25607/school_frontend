import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";

function Blob() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.4;
    ref.current.rotation.y += dt * 0.5;
  });
  return (
    <Float speed={2} rotationIntensity={0.7} floatIntensity={1.4}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color="#9b5cff"
          emissive="#5b81ff"
          emissiveIntensity={0.7}
          distort={0.5}
          speed={3}
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>
    </Float>
  );
}

export default function LogoOrb3D({ size = 64 }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 2.4], fov: 50 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 3]} color="#86a8ff" intensity={1.2} />
        <pointLight position={[-3, -3, -3]} color="#ff5ec4" intensity={0.8} />
        <Suspense fallback={null}>
          <Blob />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}
