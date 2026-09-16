import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

const styles = {
  primary:
    "bg-[#e50914] text-white shadow-[0_12px_34px_rgba(229,9,20,.3)] hover:bg-[#ff1d28] hover:shadow-[0_18px_44px_rgba(229,9,20,.42)]",
  gradient:
    "bg-gradient-to-r from-[#b20710] via-[#e50914] to-[#ff4b41] text-white shadow-[0_12px_34px_rgba(229,9,20,.28)]",
  glass:
    "border border-white/15 bg-white/[.07] text-white hover:bg-white/[.12]",
  outline:
    "border border-red-500/50 bg-red-500/5 text-red-100 hover:bg-red-500/15",
};

export default function ReactiveButton({
  children,
  variant = "primary",
  loading = false,
  className = "",
  onClick,
  type = "button",
  ...props
}) {
  const [ripple, setRipple] = useState(null);
  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setRipple({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      id: Date.now(),
    });
    onClick?.(event);
  };
  return (
    <motion.button
      type={type}
      {...props}
      disabled={loading || props.disabled}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`relative inline-flex overflow-hidden items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-red-500/70 disabled:cursor-not-allowed disabled:opacity-55 ${styles[variant]} ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {ripple && (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.55 }}
          animate={{ scale: 7, opacity: 0 }}
          transition={{ duration: 0.65 }}
          onAnimationComplete={() => setRipple(null)}
          className="pointer-events-none absolute h-10 w-10 rounded-full bg-white"
          style={{ left: ripple.x - 20, top: ripple.y - 20 }}
        />
      )}
      {loading ? <LoaderCircle className="animate-spin" size={18} /> : children}
    </motion.button>
  );
}
