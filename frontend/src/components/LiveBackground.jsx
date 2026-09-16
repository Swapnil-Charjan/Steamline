import { motion, useReducedMotion } from "framer-motion";

const orbs = [
  "-left-40 -top-40 h-[38rem] w-[38rem] bg-red-700/20",
  "right-[-10rem] top-1/4 h-[32rem] w-[32rem] bg-amber-600/10",
  "bottom-[-20rem] left-1/3 h-[40rem] w-[40rem] bg-red-950/35",
];

export default function LiveBackground() {
  const reduceMotion = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080808]"
    >
      <div className="absolute inset-0 opacity-[.17] [background-image:radial-gradient(rgba(255,255,255,.55)_0.6px,transparent_0.6px)] [background-size:4px_4px]" />
      {orbs.map((className, index) => (
        <motion.div
          key={className}
          className={`absolute rounded-full blur-[110px] will-change-transform ${className}`}
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, index === 1 ? -55 : 50, 0],
                  y: [0, index === 2 ? -38 : 44, 0],
                  scale: [1, 1.13, 1],
                }
          }
          transition={{
            duration: 16 + index * 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,.12),#080808_78%),radial-gradient(ellipse_at_50%_0%,transparent_0,rgba(8,8,8,.45)_55%,#080808_100%)]" />
    </div>
  );
}
