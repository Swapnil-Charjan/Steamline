import {
  ArrowUpRight,
  Flame,
  PlaySquare,
  Plus,
  Sparkles,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import ReelCard from "../components/ReelCard";
import GlassCard from "../components/GlassCard";
import ReactiveButton from "../components/ReactiveButton";
import { videoService } from "../services/video.service";
import { useAuth } from "../context/AuthContext";
import VideoFilters from "../components/VideoFilters";

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'videos' | 'shorts'
  const defaultFilters = {
    dateRange: "",
    startDate: "",
    endDate: "",
    type: "",
    status: "",
    sortBy: "newest",
    page: 1,
    limit: 12,
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = { ...filters };
    if (params.dateRange === "custom") delete params.dateRange;
    else {
      delete params.startDate;
      delete params.endDate;
    }
    videoService
      .mine(params)
      .then((r) => {
        setVideos(r.data.videos || []);
        setTotalPages(r.data.pagination?.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const longVideos = videos.filter(
    (v) => !v.isShort && Number(v.duration || 0) > 60,
  );
  const shortReels = videos.filter(
    (v) => v.isShort || Number(v.duration || 0) <= 60,
  );

  const displayedVideos =
    activeTab === "videos"
      ? longVideos
      : activeTab === "shorts"
        ? shortReels
        : videos;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(110deg,rgba(30,30,30,.96),rgba(12,12,12,.86))] px-6 py-10 shadow-2xl backdrop-blur-xl sm:px-8"
      >
        <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-red-600/25 blur-[85px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-red-400">
              <Sparkles size={14} /> Streamline originals
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-white via-white to-red-300 bg-clip-text text-transparent">
                Your next big story
              </span>
              <br />
              remarkable, {user?.fullname?.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">
              Your studio, your audience, your spotlight. Release the next
              chapter when it is ready.
            </p>
          </div>
          <ReactiveButton
            variant="gradient"
            onClick={() => navigate("/upload")}
          >
            <Plus size={18} /> UPLOAD <ArrowUpRight size={16} />
          </ReactiveButton>
        </div>
      </motion.div>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">
              Your studio collection
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-white">
              Your Uploads
            </h2>
          </div>

          {/* Studio Category Filter Tabs */}
          <div className="flex items-center gap-2">
            <VideoFilters
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(defaultFilters)}
            />
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "all"
                  ? "bg-white text-black shadow-md"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              All ({videos.length})
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "videos"
                  ? "bg-white text-black shadow-md"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <PlaySquare
                size={13}
                className={activeTab === "videos" ? "text-brand" : ""}
              />
              Long Videos ({longVideos.length})
            </button>

            <button
              onClick={() => setActiveTab("shorts")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "shorts"
                  ? "bg-brand text-white shadow-[0_0_15px_rgba(229,9,20,.4)]"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Flame size={13} />
              Shorts & Reels ({shortReels.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
            <div className="h-52 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-52 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : displayedVideos.length ? (
          activeTab === "shorts" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {displayedVideos.map((v) => (
                <ReelCard key={v._id} video={v} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {displayedVideos.map((v) => (
                <VideoCard key={v._id} video={v} />
              ))}
            </div>
          )
        ) : (
          <GlassCard className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-red-400/25 bg-red-500/10 text-red-300 shadow-[0_0_35px_rgba(229,9,20,.25)]">
                {activeTab === "shorts" ? <Flame size={28} /> : <Video />}
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">
                {activeTab === "shorts"
                  ? "No short reels uploaded yet"
                  : activeTab === "videos"
                    ? "No long videos uploaded yet"
                    : "Ready for your first premiere?"}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {activeTab === "shorts"
                  ? "Create a quick vertical video under 60 seconds."
                  : "Upload a video to begin building your creative universe."}
              </p>
              <ReactiveButton
                className="mt-6"
                onClick={() => navigate("/upload")}
              >
                Upload now <ArrowUpRight size={16} />
              </ReactiveButton>
            </div>
          </GlassCard>
        )}
        {totalPages > 1 && !loading && (
          <div className="mt-6 flex items-center justify-end gap-3 text-xs text-slate-400">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {filters.page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={filters.page >= totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </Layout>
  );
}
