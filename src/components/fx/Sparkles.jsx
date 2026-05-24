import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

const COLORS = ["#ffffff", "#ffd166", "#ff9ddc", "#86a8ff", "#c5a3ff", "#5cf2c4"];

function SparkleSvg({ color = "#fff", size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 0 L13.5 9.5 L24 12 L13.5 14.5 L12 24 L10.5 14.5 L0 12 L10.5 9.5 Z"
        fill={color}
      />
    </svg>
  );
}

export default function Sparkles({
  count = 18,
  className = "",
  style = {},
  area = { w: "100%", h: "100%" },
}) {
  const [seeds, setSeeds] = useState([]);

  useEffect(() => {
    setSeeds(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: rand(0, 100),
        y: rand(0, 100),
        size: rand(6, 16),
        color: COLORS[Math.floor(rand(0, COLORS.length))],
        delay: rand(0, 4),
        duration: rand(2.4, 4.4),
      }))
    );
  }, [count]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ width: area.w, height: area.h, ...style }}
    >
      {seeds.map((s) => (
        <motion.span
          key={s.id}
          className="sparkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
          }}
          initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.6, 1.15, 0.6],
            rotate: [0, 90, 180],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SparkleSvg color={s.color} size={s.size} />
        </motion.span>
      ))}
    </div>
  );
}
