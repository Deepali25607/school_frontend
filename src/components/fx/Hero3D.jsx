import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Stars,
  Sparkles as DreiSparkles,
  Environment,
  MeshDistortMaterial,
  Icosahedron,
  Torus,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";

function Knot() {
  const ref = useRef();
  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.18;
    ref.current.rotation.y += dt * 0.22;
  });
  return (
    <Float floatIntensity={2} rotationIntensity={0.6} speed={1.4}>
      <mesh ref={ref} scale={1.35}>
        <icosahedronGeometry args={[1.2, 4]} />
        <MeshDistortMaterial
          color="#5b81ff"
          emissive="#3d5fff"
          emissiveIntensity={0.45}
          distort={0.42}
          speed={2.2}
          roughness={0.18}
          metalness={0.55}
        />
      </mesh>
    </Float>
  );
}

function Ring({ radius = 2.4, thick = 0.04, color = "#ff5ec4", speed = 0.4, axis = [1, 0.4, 0.2] }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * speed * axis[0];
    ref.current.rotation.y += dt * speed * axis[1];
    ref.current.rotation.z += dt * speed * axis[2];
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, thick, 24, 200]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0.2} />
    </mesh>
  );
}

function Orbs() {
  const items = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const r = 2.8 + Math.random() * 1.6;
        const t = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * 2.6;
        return {
          pos: [Math.cos(t) * r, y, Math.sin(t) * r],
          color: ["#86a8ff", "#ff9ddc", "#5cf2c4", "#ffd166", "#c5a3ff"][i % 5],
          scale: 0.08 + Math.random() * 0.14,
        };
      }),
    []
  );
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <group ref={ref}>
      {items.map((o, i) => (
        <Float key={i} speed={1.6} rotationIntensity={1} floatIntensity={1.5}>
          <mesh position={o.pos} scale={o.scale}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshStandardMaterial
              color={o.color}
              emissive={o.color}
              emissiveIntensity={1.4}
              roughness={0.15}
              metalness={0.4}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Hero3D({ interactive = false }) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 5.2], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#06061a"]} />
      <fog attach="fog" args={["#06061a", 6, 14]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 6, 5]} intensity={1.2} color="#86a8ff" />
      <pointLight position={[-6, -3, -4]} intensity={0.8} color="#ff5ec4" />
      <Suspense fallback={null}>
        <Knot />
        <Ring radius={2.0} color="#86a8ff" speed={0.5} axis={[1, 0.3, 0.1]} />
        <Ring radius={2.6} color="#ff5ec4" speed={0.35} axis={[0.4, 1, 0.2]} />
        <Ring radius={3.2} color="#5cf2c4" speed={0.25} axis={[0.2, 0.6, 1]} />
        <Orbs />
        <DreiSparkles count={120} scale={[8, 5, 6]} size={3} speed={0.6} color="#ffffff" />
        <Stars radius={20} depth={30} count={1200} factor={2.4} fade speed={0.6} />
        <Environment preset="night" />
      </Suspense>
      {interactive && <OrbitControls enablePan={false} enableZoom={false} />}
    </Canvas>
  );
}
