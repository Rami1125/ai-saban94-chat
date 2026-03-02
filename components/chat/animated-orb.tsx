"use client";

import { motion } from "framer-motion";

export function AnimatedOrb({ size = 192 }: { size?: number }) {
  const floatingCircles = [...Array(5).keys()];

  return (
    <div className="w-full flex justify-center pointer-events-none absolute bottom-10 left-0 right-0 z-0">
      <motion.div
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative rounded-full overflow-hidden mix-blend-screen"
        style={{
          width: size,
          height: size,
          filter: "blur(40px) hue-rotate(15deg)",
        }}
      >
        {floatingCircles.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size * 0.8,
              height: size * 0.8,
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.8), rgba(0, 0, 0, 0))",
              left: "10%",
              top: "10%",
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 80, 0],
              y: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 80, 0],
              rotate: [0, 90, -90, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
