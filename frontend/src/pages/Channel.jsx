import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Flame, PlaySquare, UserCheck, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";

import Layout from "../components/Layout";
import VideoCard from "../components/VideoCard";
import ReelCard from "../components/ReelCard";

import { userService } from "../services/user.service";
import { videoService } from "../services/video.service";
import { subscribeService } from "../services/subscribe.service";
import { mediaUrl } from "../lib/media";
import { useAuth } from "../context/AuthContext";

export default function Channel() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("videos");
  const [subscribing, setSubscribing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChannelData = async () => {
    try {
      setLoading(true);
      setError("");
      if (!username) {
        setError("Channel username is missing.");
        return;
      }

      const channelResponse = await userService.channelProfile(username);

      let channelData = null;

      if (channelResponse?.data?.data) {
        channelData = channelResponse.data.data;
      } else if (channelResponse?.data) {
        channelData = channelResponse.data;
      } else if (channelResponse) {
        channelData = channelResponse;
      }

      // If API returned an array
      if (Array.isArray(channelData)) {
        channelData = channelData[0];
      }

      if (!channelData?._id) {
        console.error("Channel data does not contain _id:", channelData);

        setChannel(null);
        setVideos([]);
        setError("Channel not found.");
        return;
      }

      setChannel(channelData);

      // ---------------------------------------
      // 2. Get channel videos
      // ---------------------------------------
      const videosResponse = await videoService.channel(channelData._id);
      let videosData = null;

      if (videosResponse?.data?.data) {
        videosData = videosResponse.data.data;
      } else if (videosResponse?.data) {
        videosData = videosResponse.data;
      } else {
        videosData = videosResponse;
      }

      // Handle { videos: [...] }
      if (videosData?.videos) {
        videosData = videosData.videos;
      }

      if (!Array.isArray(videosData)) {
        videosData = [];
      }

      setVideos(videosData);
    } catch (err) {
      console.error("CHANNEL LOAD ERROR:", err);

      console.error("Error response:", err?.response);

      console.error("Error response data:", err?.response?.data);

      setChannel(null);
      setVideos([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load channel.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, [username]);

  // ---------------------------------------
  // Subscribe / Unsubscribe
  // ---------------------------------------
  const handleSubscribeToggle = async () => {
    if (!channel?._id) return;

    setSubscribing(true);

    try {
      if (channel.isSubscribed) {
        await subscribeService.unsubscribe(channel._id);

        toast.success(`Unsubscribed from @${channel.username}`);

        setChannel((prev) => ({
          ...prev,
          isSubscribed: false,
          subscribersCount: Math.max(0, (prev.subscribersCount || 0) - 1),
        }));
      } else {
        await subscribeService.subscribe(channel._id);

        toast.success(`Subscribed to @${channel.username}!`);

        setChannel((prev) => ({
          ...prev,
          isSubscribed: true,
          subscribersCount: (prev.subscribersCount || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Subscription error:", err);

      toast.error(
        err?.response?.data?.message || "Unable to update subscription.",
      );
    } finally {
      setSubscribing(false);
    }
  };

  // ---------------------------------------
  // Loading
  // ---------------------------------------
  if (loading) {
    return (
      <Layout>
        <div className="flex h-72 items-center justify-center">
          <p className="text-slate-400">Loading channel…</p>
        </div>
      </Layout>
    );
  }

  // ---------------------------------------
  // Error
  // ---------------------------------------
  if (error || !channel) {
    return (
      <Layout>
        <div className="flex h-72 flex-col items-center justify-center">
          <p className="text-lg font-bold text-white">Channel not found</p>

          <p className="mt-2 text-sm text-slate-400">
            {error || "Unable to load channel."}
          </p>
        </div>
      </Layout>
    );
  }

  const isSelf =
    currentUser?._id === channel._id ||
    currentUser?.username === channel.username;

  // ---------------------------------------
  // Separate videos / shorts
  // ---------------------------------------
  const longVideos = videos.filter(
    (video) => !video.isShort && Number(video.duration || 0) > 60,
  );

  const shortReels = videos.filter(
    (video) => video.isShort || Number(video.duration || 0) <= 60,
  );

  return (
    <Layout>
      {/* =====================================
          CHANNEL HEADER
      ====================================== */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {/* Cover */}
        <div className="h-48 bg-gradient-to-br from-brand to-[#252142]">
          {channel.coverImage && (
            <img
              className="h-80 w-full object-cover"
              src={mediaUrl(channel.coverImage)}
              alt="Channel Cover"
            />
          )}
        </div>

        {/* Channel details */}
        <div className="flex flex-wrap items-end justify-between gap-4 p-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Avatar */}
            <img
              className="-mt-16 h-28 w-28 rounded-2xl border-4 border-panel bg-panel object-cover shadow-2xl"
              src={mediaUrl(channel.avatar)}
              alt={channel.username}
            />

            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {channel.fullname || channel.username}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  @{channel.username}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
                  <Users size={13} className="text-red-400" />
                  {channel.subscribersCount || 0} subscribers
                </span>
              </div>
            </div>
          </div>

          {!isSelf && (
            <button
              type="button"
              disabled={subscribing}
              onClick={handleSubscribeToggle}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                channel.isSubscribed
                  ? "border border-white/20 bg-white/10 text-slate-200 hover:border-red-500/30 hover:bg-red-500/20 hover:text-red-300"
                  : "bg-brand text-white shadow-[0_0_20px_rgba(229,9,20,.4)] hover:scale-105 hover:bg-brand-hover"
              }`}
            >
              {channel.isSubscribed ? (
                <>
                  <UserCheck size={17} />
                  Subscribed
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Subscribe
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* =====================================
          TABS
      ====================================== */}
      <div className="mt-8 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === "videos"
                ? "bg-white text-black shadow-lg"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <PlaySquare
              size={16}
              className={activeTab === "videos" ? "text-brand" : ""}
            />
            Videos ({longVideos.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shorts")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === "shorts"
                ? "bg-brand text-white shadow-[0_0_20px_rgba(229,9,20,.4)]"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Flame size={16} />
            Shorts & Reels ({shortReels.length})
          </button>
        </div>

        <span className="hidden text-xs font-semibold text-slate-400 sm:inline">
          Total {videos.length} uploads
        </span>
      </div>

      {/* =====================================
          VIDEOS
      ====================================== */}
      {activeTab === "videos" ? (
        longVideos.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {longVideos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-slate-400">
              <PlaySquare size={24} />
            </div>

            <p className="mt-4 font-bold text-white">
              No full-length videos uploaded yet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Check the Shorts & Reels tab or check back later!
            </p>
          </div>
        )
      ) : shortReels.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shortReels.map((video) => (
            <ReelCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-slate-400">
            <Flame size={24} />
          </div>

          <p className="mt-4 font-bold text-white">
            No short reels uploaded yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            This channel hasn't uploaded any quick shorts yet.
          </p>
        </div>
      )}
    </Layout>
  );
}
