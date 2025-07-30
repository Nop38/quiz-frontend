import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Feu d'artifice.
 * - inline = true  -> wrapper en absolute dans un conteneur relatif
 * - inline = false -> wrapper en fixed sur tout l'écran
 */
export default function Fireworks({
  count = 36,
  duration = 1.4,
  inline = false,
  className = "",
  style = {},
}) {
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 160;
      const size = 6 + Math.random() * 10;
      arr.push({
        key: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size,
        delay: Math.random() * 0.25,
        color: `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`,
      });
    }
    return arr;
  }, [count]);

  const easeCurve = [0.16, 0.84, 0.44, 1];

  const wrapperClass = inline
    ? "pointer-events-none absolute inset-0 flex items-center justify-center z-20"
    : "pointer-events-none fixed inset-0 flex items-center justify-center z-[9999]";

  return (
    <div className={`${wrapperClass} ${className}`} style={style}>
      {particles.map((p) => (
        <motion.div
          key={p.key}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 1, opacity: 0 }}
          transition={{ duration, delay: p.delay, ease: easeCurve }}
          style={{
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            position: "absolute",
          }}
        />
      ))}
    </div>
  );
}
