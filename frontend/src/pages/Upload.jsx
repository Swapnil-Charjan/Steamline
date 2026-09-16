import {
  FileVideo,
  Flame,
  Globe,
  Image,
  Lock,
  PlaySquare,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { videoService } from "../services/video.service";

export default function Upload() {
  const [data, setData] = useState({
    title: "",
    description: "",
    duration: "",
    isShort: false,
    isSubscribersOnly: false,
    videoFile: null,
    thumbnail: null,
  });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const set = (e) => {
    const value = e.target.files?.[0] || e.target.value;
    if (e.target.name === "videoFile" && e.target.files?.[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const seconds = Math.ceil(Number(video.duration || 0));
        setData((prev) => ({
          ...prev,
          videoFile: file,
          duration: seconds || prev.duration,
        }));
        URL.revokeObjectURL(objectUrl);
      };
      video.src = objectUrl;
      return;
    }

    setData({
      ...data,
      [e.target.name]: value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (data.isShort && Number(data.duration) > 60) {
      toast.error("Shorts / Reels must be 60 seconds or less!");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v));
      await videoService.upload(fd);
      toast.success(
        data.isShort
          ? "Short reel published to Shorts feed!"
          : "Long video published successfully!",
      );
      nav(data.isShort ? "/shorts" : "/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">
          New release
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Upload Content</h1>
        <p className="mt-2 text-sm text-slate-400">
          Choose format, give your audience a great impression, and set premiere
          access.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          {/* Format Type Selection: Long Video vs Short / Reel */}
          <div className="card p-5">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Select Release Format
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setData({ ...data, isShort: false })}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  !data.isShort
                    ? "border-brand bg-brand/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <PlaySquare
                  className={`mt-0.5 shrink-0 ${!data.isShort ? "text-brand" : "text-slate-400"}`}
                  size={22}
                />
                <div>
                  <p className="text-sm font-bold text-white">
                    Full Video (Long)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Standard landscape video for deep stories and full-length
                    episodes.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setData({ ...data, isShort: true })}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  data.isShort
                    ? "border-brand bg-brand/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <Flame
                  className={`mt-0.5 shrink-0 ${data.isShort ? "text-brand" : "text-slate-400"}`}
                  size={22}
                />
                <div>
                  <p className="text-sm font-bold text-white">
                    Short / Reel (≤ 60s)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Quick vertical video featured directly in the swipeable
                    Shorts feed.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="card cursor-pointer p-6 text-center transition hover:border-brand">
              <FileVideo className="mx-auto text-brand" />
              <p className="mt-3 font-bold">
                {data.isShort ? "Short Video File" : "Video file"}
              </p>
              <p className="mt-1 text-xs text-slate-400">MP4, MOV, WebM</p>
              <input
                onChange={set}
                name="videoFile"
                type="file"
                accept="video/*"
                required
                className="mt-4 w-full text-xs text-slate-400"
              />
            </label>
            <label className="card cursor-pointer p-6 text-center transition hover:border-brand">
              <Image className="mx-auto text-brand" />
              <p className="mt-3 font-bold">Thumbnail</p>
              <p className="mt-1 text-xs text-slate-400">
                A striking cover image
              </p>
              <input
                onChange={set}
                name="thumbnail"
                type="file"
                accept="image/*"
                required
                className="mt-4 w-full text-xs text-slate-400"
              />
            </label>
          </div>

          <div className="card space-y-4 p-5">
            <input
              className="input"
              name="title"
              placeholder={
                data.isShort
                  ? "Short title (e.g. Crazy plot twist! #shorts)"
                  : "An irresistible title"
              }
              required
              onChange={set}
            />
            <textarea
              className="input min-h-32 resize-y"
              name="description"
              placeholder="Tell viewers what they’ll discover…"
              required
              onChange={set}
            />
            <div>
              <input
                className="input max-w-xs"
                name="duration"
                type="number"
                min="1"
                max={data.isShort ? 60 : undefined}
                placeholder={
                  data.isShort
                    ? "Duration in seconds (max 60)"
                    : "Duration in seconds"
                }
                required
                onChange={set}
              />
              {data.isShort && (
                <p className="mt-1.5 text-xs text-amber-400/90 font-medium">
                  ⚡ Shorts & Reels must be 60 seconds or less.
                </p>
              )}
            </div>
          </div>

          {/* Audience Visibility Options */}
          <div className="card p-5">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Audience & Privacy
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setData({ ...data, isSubscribersOnly: false })}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  !data.isSubscribersOnly
                    ? "border-brand bg-brand/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <Globe
                  className={`mt-0.5 shrink-0 ${!data.isSubscribersOnly ? "text-brand" : "text-slate-400"}`}
                  size={20}
                />
                <div>
                  <p className="text-sm font-bold text-white">Public</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Anyone can search, discover, and watch this content.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setData({ ...data, isSubscribersOnly: true })}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  data.isSubscribersOnly
                    ? "border-brand bg-brand/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <Lock
                  className={`mt-0.5 shrink-0 ${data.isSubscribersOnly ? "text-brand" : "text-slate-400"}`}
                  size={20}
                />
                <div>
                  <p className="text-sm font-bold text-white">
                    Subscribers Only
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Exclusive release. Only subscribers of your channel can
                    unlock and watch.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={busy} className="btn-primary">
              <UploadCloud size={18} />
              {busy
                ? "Publishing…"
                : data.isShort
                  ? "Publish Reel"
                  : "Publish Video"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
