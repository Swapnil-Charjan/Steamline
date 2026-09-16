import { Eye, Lock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../lib/media";

const formatViews = (n = 0) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(n);

export default function VideoCard({ video, compact = false }) {
  return (
    <Link
      to={`/watch/${video._id}`}
      className={`group block ${compact ? "" : ""}`}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5 border border-white/5">
        <img
          src={mediaUrl(video.thumbnail)}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {video.isSubscribersOnly && (
            <span className="flex items-center gap-1 rounded bg-black/85 border border-red-500/30 px-2 py-0.5 text-[10px] font-extrabold text-red-400 backdrop-blur-md">
              <Lock size={10} /> SUBSCRIBERS
            </span>
          )}
        </div>

        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-slate-200">
          {Math.round(video.duration || 0)}s
        </span>

        <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/30">
          <span className="scale-75 rounded-full bg-white/90 p-3 text-ink opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
            <Play size={20} fill="currentColor" />
          </span>
        </span>
      </div>
      <div className="pt-3">
        <h3 className="line-clamp-1 font-bold text-white group-hover:text-red-300 transition">{video.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Eye size={13} />
          {formatViews(video.views)} views <span>·</span>{" "}
          {new Date(video.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
