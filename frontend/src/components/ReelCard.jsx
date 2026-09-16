import { Eye, Flame, Heart, Lock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../lib/media";

const formatNumber = (n = 0) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(n);

export default function ReelCard({ video }) {
  return (
    <Link
      to={`/watch/${video._id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-black shadow-xl transition-all duration-300 hover:scale-[1.03] hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(229,9,20,.2)]"
    >
      {/* 9:16 Vertical Aspect Ratio Container */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-white/5">
        <img
          src={mediaUrl(video.thumbnail)}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

        {/* Top Badges: Shorts Icon & Locked Badge */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur-md shadow-md">
            <Flame size={11} /> REEL
          </span>

          {video.isSubscribersOnly && (
            <span className="flex items-center gap-1 rounded-full bg-black/80 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
              <Lock size={10} /> Lock
            </span>
          )}
        </div>

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 scale-75 place-items-center rounded-full bg-white/90 text-black opacity-0 transition group-hover:scale-100 group-hover:opacity-100 shadow-xl">
            <Play size={20} fill="currentColor" />
          </span>
        </div>

        {/* Bottom Metadata */}
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <p className="line-clamp-2 text-xs font-bold leading-tight group-hover:text-red-300 transition">
            {video.title}
          </p>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <Eye size={12} className="text-slate-400" />
              {formatNumber(video.views)}
            </span>

            <span className="flex items-center gap-1 text-red-400 font-semibold">
              <Heart size={11} fill="currentColor" />
              {formatNumber(video.likesCount || 0)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
