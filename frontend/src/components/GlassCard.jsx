import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", hover = true, ...props }) {
  return <motion.section {...props} whileHover={hover ? { y: -5, rotateX: 0.5, rotateY: -0.5 } : undefined} transition={{ type: "spring", stiffness: 300, damping: 24 }} className={`glass-card ${className}`}>{children}</motion.section>;
}
