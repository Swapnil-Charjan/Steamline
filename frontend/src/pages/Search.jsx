import {
  Compass,
  Flame,
  PlaySquare,
  Search as SearchIcon,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import ReelCard from "../components/ReelCard";
import GlassCard from "../components/GlassCard";
import VideoFilters from "../components/VideoFilters";

import { userService } from "../services/user.service";
import { videoService } from "../services/video.service";
import { subscribeService } from "../services/subscribe.service";
import { mediaUrl } from "../lib/media";
import { useAuth } from "../context/AuthContext";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [subscribingId, setSubscribingId] = useState(null);
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

  // Get q directly from URL
  const currentQuery = (searchParams.get("q") || "").trim();

  /**
   * Perform search
   */
  const performSearch = async (keyword, selectedFilters = filters) => {
    if (!keyword) {
      setChannels([]);
      setVideos([]);
      setLoading(false);

      return;
    }

    setLoading(true);

    try {
      const params = { ...selectedFilters };
      if (params.dateRange === "custom") delete params.dateRange;
      else {
        delete params.startDate;
        delete params.endDate;
      }
      const response = await userService.search(keyword, params);

      let searchData = {};

      // Axios response:
      // response.data = backend response
      if (response?.data?.data) {
        searchData = response.data.data;
      }
      // Already unwrapped backend response:
      else if (response?.data) {
        searchData = response.data;
      }
      // Direct backend data
      else if (response) {
        searchData = response;
      }

      const foundChannels = Array.isArray(searchData?.channels)
        ? searchData.channels
        : [];

      const foundVideos = Array.isArray(searchData?.videos)
        ? searchData.videos
        : [];

      setChannels(foundChannels);
      setVideos(foundVideos);
      setTotalPages(searchData?.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Search API error:", error);
      console.error("Search API error response:", error?.response);
      console.error("Search API error data:", error?.response?.data);

      setChannels([]);
      setVideos([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to search. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search whenever URL q changes
   */
  useEffect(() => {
    setQuery(currentQuery);

    if (currentQuery) {
      performSearch(currentQuery, filters);
    } else {
      setChannels([]);
      setVideos([]);
      setLoading(false);
    }
  }, [currentQuery, filters]);

  const handleFilterChange = (nextFilters) => setFilters(nextFilters);

  const clearFilters = () => setFilters(defaultFilters);

  /**
   * Search form submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    const keyword = query.trim();

    if (!keyword) {
      setSearchParams({});
      return;
    }

    setSearchParams({
      q: keyword,
    });
  };

  /**
   * Clear search
   */
  const handleClearSearch = () => {
    setQuery("");
    setSearchParams({});
    setChannels([]);
    setVideos([]);
    setActiveTab("all");
    setFilters(defaultFilters);
  };

  /**
   * Subscribe / unsubscribe
   */
  const handleSubscribeToggle = async (channel) => {
    if (!channel?._id) return;

    setSubscribingId(channel._id);

    try {
      if (channel.isSubscribed) {
        await subscribeService.unsubscribe(channel._id);

        toast.success(`Unsubscribed from @${channel.username}`);

        setChannels((prev) =>
          prev.map((c) =>
            c._id === channel._id
              ? {
                  ...c,
                  isSubscribed: false,
                  subscribersCount: Math.max(0, (c.subscribersCount || 0) - 1),
                }
              : c,
          ),
        );
      } else {
        await subscribeService.subscribe(channel._id);

        toast.success(`Subscribed to @${channel.username}!`);

        setChannels((prev) =>
          prev.map((c) =>
            c._id === channel._id
              ? {
                  ...c,
                  isSubscribed: true,
                  subscribersCount: (c.subscribersCount || 0) + 1,
                }
              : c,
          ),
        );
      }
    } catch (error) {
      console.error("Subscription error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to update subscription.",
      );
    } finally {
      setSubscribingId(null);
    }
  };

  const totalResults = channels.length + videos.length;

  const longVideos = videos.filter(
    (video) => !video.isShort && Number(video.duration || 0) > 60,
  );

  const shortReels = videos.filter(
    (video) => video.isShort || Number(video.duration || 0) <= 60,
  );

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        {/* =========================
            TABS
        ========================== */}
        {currentQuery && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-brand text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                All ({totalResults})
              </button>

              <VideoFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={clearFilters}
              />

              <button
                type="button"
                onClick={() => setActiveTab("channels")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "channels"
                    ? "bg-brand text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Channels ({channels.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "videos"
                    ? "bg-brand text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <PlaySquare size={13} />
                Long Videos ({longVideos.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("shorts")}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "shorts"
                    ? "bg-brand text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Flame size={13} />
                Shorts & Reels ({shortReels.length})
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Showing results for{" "}
              <span className="font-semibold text-white">"{currentQuery}"</span>
            </p>
          </div>
        )}

        {currentQuery && totalPages > 1 && !loading && (
          <div className="mb-6 flex items-center justify-end gap-3 text-xs text-slate-400">
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

        {/* =========================
            LOADING
        ========================== */}
        {loading && (
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-44 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-44 animate-pulse rounded-2xl bg-white/5" />
          </div>
        )}

        {/* =========================
            EMPTY SEARCH
        ========================== */}
        {!currentQuery && !loading && (
          <GlassCard className="grid min-h-80 place-items-center p-10 text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-red-400/20 bg-red-600/10 text-brand">
                <SearchIcon size={28} />
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                Explore Channels & Creators
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Search for any creator by channel name or @handle to discover
                their videos, watch previews, and subscribe for exclusive
                subscriber releases.
              </p>
            </div>
          </GlassCard>
        )}

        {/* =========================
            NO RESULTS
        ========================== */}
        {currentQuery && !loading && totalResults === 0 && (
          <GlassCard className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-white/5 text-slate-400">
                <X size={24} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-white">
                No results found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                We couldn't find any channels or videos matching "{currentQuery}
                ".
              </p>
            </div>
          </GlassCard>
        )}

        {/* =========================
            RESULTS
        ========================== */}
        {!loading && totalResults > 0 && (
          <div className="space-y-10">
            {/* CHANNELS */}
            {(activeTab === "all" || activeTab === "channels") &&
              channels.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                      <Users className="text-brand" size={20} />
                      Channels ({channels.length})
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {channels.map((channel) => {
                      const isSelf =
                        currentUser?._id === channel._id ||
                        currentUser?.username === channel.username;

                      return (
                        <div
                          key={channel._id}
                          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent p-5 sm:p-6">
                            <div className="flex items-center gap-4">
                              <Link to={`/channel/${channel.username}`}>
                                <img
                                  src={mediaUrl(channel.avatar)}
                                  alt={channel.username}
                                  className="h-16 w-16 rounded-2xl border-2 border-white/10 object-cover shadow-lg transition hover:scale-105"
                                />
                              </Link>

                              <div>
                                <Link
                                  to={`/channel/${channel.username}`}
                                  className="text-lg font-extrabold text-white transition hover:text-red-400"
                                >
                                  {channel.fullname || channel.username}
                                </Link>

                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                                    @{channel.username}
                                  </span>

                                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold text-red-300">
                                    <Users size={11} className="text-red-400" />
                                    {channel.subscribersCount || 0} subscribers
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Link
                                to={`/channel/${channel.username}`}
                                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                              >
                                View Channel
                              </Link>

                              {!isSelf && (
                                <button
                                  type="button"
                                  disabled={subscribingId === channel._id}
                                  onClick={() => handleSubscribeToggle(channel)}
                                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                                    channel.isSubscribed
                                      ? "border border-white/20 bg-white/10 text-slate-200 hover:bg-red-500/20 hover:text-red-300"
                                      : "bg-brand text-white shadow-[0_0_15px_rgba(229,9,20,.4)] hover:bg-brand-hover"
                                  }`}
                                >
                                  {channel.isSubscribed ? (
                                    <>
                                      <UserCheck size={14} />
                                      Subscribed
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus size={14} />
                                      Subscribe
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-5 sm:p-6">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Recent Videos from this Channel
                            </p>

                            {Array.isArray(channel.videos) &&
                            channel.videos.length > 0 ? (
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {channel.videos.map((video) => (
                                  <VideoCard key={video._id} video={video} />
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs italic text-slate-500">
                                This channel has not uploaded any videos yet.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

            {/* LONG VIDEOS */}
            {(activeTab === "all" || activeTab === "videos") &&
              longVideos.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                      <PlaySquare className="text-brand" size={20} />
                      Full Videos ({longVideos.length})
                    </h2>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {longVideos.map((video) => (
                      <VideoCard key={video._id} video={video} />
                    ))}
                  </div>
                </section>
              )}

            {/* SHORTS */}
            {(activeTab === "all" || activeTab === "shorts") &&
              shortReels.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                      <Flame className="text-brand" size={20} />
                      Shorts & Reels ({shortReels.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {shortReels.map((video) => (
                      <ReelCard key={video._id} video={video} />
                    ))}
                  </div>
                </section>
              )}
          </div>
        )}
      </div>
    </Layout>
  );
}
