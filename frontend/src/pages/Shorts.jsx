import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  Lock,
  MessageCircle,
  Music,
  Pause,
  Pencil,
  Play,
  Send,
  Share2,
  Sparkles,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
  X,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { videoService } from "../services/video.service";
import { likeService } from "../services/like.service";
import { subscribeService } from "../services/subscribe.service";
import { commentService } from "../services/comment.service";
import { userService } from "../services/user.service";
import { mediaUrl } from "../lib/media";
import { useAuth } from "../context/AuthContext";

const appendReply = (items, parentId, reply) =>
  items.map((comment) => {
    if (comment._id === parentId) {
      return { ...comment, replies: [...(comment.replies || []), reply] };
    }
    return comment.replies?.length
      ? { ...comment, replies: appendReply(comment.replies, parentId, reply) }
      : comment;
  });
const updateCommentTree = (items, commentId, updated) =>
  items.map((comment) =>
    comment._id === commentId
      ? { ...updated, replies: comment.replies || updated.replies || [] }
      : comment.replies?.length
        ? {
            ...comment,
            replies: updateCommentTree(comment.replies, commentId, updated),
          }
        : comment,
  );
const removeCommentTree = (items, commentId) =>
  items
    .filter((comment) => comment._id !== commentId)
    .map((comment) =>
      comment.replies?.length
        ? { ...comment, replies: removeCommentTree(comment.replies, commentId) }
        : comment,
    );

export default function Shorts() {
  const [shorts, setShorts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [expandedCommentIds, setExpandedCommentIds] = useState(new Set());
  const [subscribingId, setSubscribingId] = useState(null);
  const videoRefs = useRef([]);
  const { user: currentUser } = useAuth();

  const fetchShorts = async () => {
    try {
      setLoading(true);
      const res = await videoService.shorts();
      setShorts(res.data || []);
    } catch (err) {
      console.error("Failed to load shorts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  // Handle video playback when currentIndex or isPlaying changes
  useEffect(() => {
    videoRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx === currentIndex && isPlaying) {
        videoEl.play().catch(() => {
          // Autoplay policy might require user interaction or muted
        });
      } else {
        videoEl.pause();
      }
    });
  }, [currentIndex, isPlaying, shorts]);

  // Load comments when comment drawer opens
  useEffect(() => {
    if (showComments && shorts[currentIndex]) {
      commentService
        .getComments(shorts[currentIndex]._id)
        .then((res) => setComments(res.data || []))
        .catch((err) => console.error("Error loading comments:", err));
    }
  }, [showComments, currentIndex, shorts]);

  // Keyboard Navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showComments) return; // don't navigate when typing comment
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        goPrev();
      } else if (e.key === " " || e.key === "k") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === "m") {
        setMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, shorts.length, showComments]);

  const goNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    } else {
      toast("You've reached the end of the reel feed!", { icon: "✨" });
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleToggleLike = async (short) => {
    if (!short?._id) return;
    const prevLiked = short.isLiked;
    const prevLikesCount = short.likesCount || 0;

    // Optimistic Update
    setShorts((prev) =>
      prev.map((s) =>
        s._id === short._id
          ? {
              ...s,
              isLiked: !prevLiked,
              likesCount: prevLiked
                ? Math.max(0, prevLikesCount - 1)
                : prevLikesCount + 1,
            }
          : s,
      ),
    );

    try {
      const res = await likeService.toggleLike(short._id);
      setShorts((prev) =>
        prev.map((s) =>
          s._id === short._id
            ? {
                ...s,
                isLiked: res.data.isLiked,
                likesCount: res.data.likesCount,
              }
            : s,
        ),
      );
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setShorts((prev) =>
        prev.map((s) =>
          s._id === short._id
            ? { ...s, isLiked: prevLiked, likesCount: prevLikesCount }
            : s,
        ),
      );
    }
  };

  const handleSubscribeToggle = async (channelId, username) => {
    if (!channelId) return;
    setSubscribingId(channelId);
    try {
      const currentShort = shorts[currentIndex];
      if (currentShort?.isSubscribed) {
        await subscribeService.unsubscribe(channelId);
        toast.success(`Unsubscribed from @${username}`);
        setShorts((prev) =>
          prev.map((s) =>
            s.owner?._id === channelId ? { ...s, isSubscribed: false } : s,
          ),
        );
      } else {
        await subscribeService.subscribe(channelId);
        toast.success(`Subscribed to @${username}!`);
        setShorts((prev) =>
          prev.map((s) =>
            s.owner?._id === channelId
              ? { ...s, isSubscribed: true, isLocked: false }
              : s,
          ),
        );
        // Refresh feed so unlocked video stream is loaded
        fetchShorts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribingId(null);
    }
  };

  const handleShare = (short) => {
    const shareUrl = `${window.location.origin}/watch/${short._id}`;
    if (navigator.share) {
      navigator
        .share({
          title: short.title,
          text: `Check out this reel by @${short.owner?.username} on Streamline!`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Reel link copied to clipboard!");
    }
  };

  const handleToggleSave = async (short) => {
    if (!short?._id) return;
    const prevSaved = short.isSaved;

    setShorts((prev) =>
      prev.map((item) =>
        item._id === short._id ? { ...item, isSaved: !prevSaved } : item,
      ),
    );

    try {
      const res = await userService.toggleSaveVideo(short._id);
      const isSaved = res.data?.isSaved ?? !prevSaved;
      setShorts((prev) =>
        prev.map((item) =>
          item._id === short._id ? { ...item, isSaved } : item,
        ),
      );
      toast.success(isSaved ? "Saved" : "Removed from saved");
    } catch (err) {
      console.error(err);
      setShorts((prev) =>
        prev.map((item) =>
          item._id === short._id ? { ...item, isSaved: prevSaved } : item,
        ),
      );
      toast.error(err?.response?.data?.message || "Unable to save reel");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !shorts[currentIndex]) return;
    setSubmittingComment(true);
    try {
      const res = await commentService.addComment(
        shorts[currentIndex]._id,
        commentText.trim(),
      );
      setComments((prev) => [res.data, ...prev]);
      setCommentText("");
      // Update comment count on short
      setShorts((prev) =>
        prev.map((s, i) =>
          i === currentIndex
            ? { ...s, commentsCount: (s.commentsCount || 0) + 1 }
            : s,
        ),
      );
      toast.success("Comment posted!");
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (e, targetComment) => {
    e.preventDefault();
    if (!replyText.trim() || !shorts[currentIndex]) return;

    setSubmittingReplyId(targetComment._id);

    try {
      const res = await commentService.replyToComment(
        shorts[currentIndex]._id,
        targetComment._id,
        replyText.trim(),
      );

      setComments((prev) => appendReply(prev, targetComment._id, res.data));

      setReplyText("");
      setReplyingTo(null);
      setShorts((prev) =>
        prev.map((s, i) =>
          i === currentIndex
            ? { ...s, commentsCount: (s.commentsCount || 0) + 1 }
            : s,
        ),
      );
      toast.success("Reply posted!");
    } catch (err) {
      console.error("Error replying to comment:", err);
      toast.error(err?.response?.data?.message || "Unable to post reply.");
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const renderReplies = (replies) => (
    <div className="mt-3 ml-3 space-y-2 border-l border-white/10 pl-3">
      {replies.map((reply) => (
        <div key={reply._id} className="rounded-lg bg-white/5 p-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="font-bold text-white">
              @{reply.owner?.username}
            </span>
            {reply.replyTo && (
              <span>replying to @{reply.replyTo.username}</span>
            )}
          </div>
          <p className="mt-1 text-slate-300 leading-relaxed">{reply.content}</p>
          {(currentUser?._id === reply.owner?._id ||
            currentUser?._id === currentShort?.owner?._id) && (
            <div className="mt-2 flex gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setEditingCommentId(reply._id);
                  setEditText(reply.content);
                }}
                className="text-slate-400 hover:text-white"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteComment(reply._id)}
                className="text-red-300 hover:text-red-200"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
          {editingCommentId === reply._id && (
            <form
              onSubmit={(e) => handleEditComment(e, reply._id)}
              className="mt-2 flex gap-2"
            >
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="input flex-1 py-2 text-[11px]"
              />
              <button
                type="submit"
                className="btn-primary px-3 py-2 text-[10px]"
              >
                Save
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() =>
              setReplyingTo((prev) => (prev?._id === reply._id ? null : reply))
            }
            className="mt-2 text-[10px] font-semibold text-red-300 hover:text-red-200"
          >
            Reply
          </button>
          {replyingTo?._id === reply._id && (
            <form
              onSubmit={(e) => handleReplySubmit(e, reply)}
              className="mt-2 flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${reply.owner?.username}`}
                className="input py-2 text-[11px] flex-1 bg-white/5 border-white/15"
              />
              <button
                type="submit"
                disabled={submittingReplyId === reply._id || !replyText.trim()}
                className="btn-primary py-2 px-3 text-[10px]"
              >
                {submittingReplyId === reply._id ? "..." : "Send"}
              </button>
            </form>
          )}
          {reply.replies?.length > 0 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setExpandedCommentIds((previous) => {
                    const next = new Set(previous);
                    next.has(reply._id)
                      ? next.delete(reply._id)
                      : next.add(reply._id);
                    return next;
                  })
                }
                className="mt-2 text-[10px] text-slate-400"
              >
                {expandedCommentIds.has(reply._id) ? "Hide" : "Show"}{" "}
                {reply.replies.length} replies
              </button>
              {expandedCommentIds.has(reply._id) &&
                renderReplies(reply.replies)}
            </>
          )}
        </div>
      ))}
    </div>
  );

  const handleEditComment = async (event, commentId) => {
    event.preventDefault();
    try {
      const response = await commentService.updateComment(
        shorts[currentIndex]._id,
        commentId,
        editText,
      );
      setComments((prev) => updateCommentTree(prev, commentId, response.data));
      setEditingCommentId(null);
      toast.success("Comment updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to edit comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(shorts[currentIndex]._id, commentId);
      setComments((prev) => removeCommentTree(prev, commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete comment");
    }
  };

  const currentShort = shorts[currentIndex];

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8.5rem)] items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500/20 border-t-brand" />
            <p className="text-sm font-semibold text-slate-400">
              Loading reels…
            </p>
          </div>
        ) : shorts.length === 0 ? (
          <div className="text-center p-8 rounded-2xl border border-white/10 bg-white/5 max-w-md">
            <Sparkles className="mx-auto text-brand mb-3" size={32} />
            <h3 className="text-xl font-bold text-white">No Reels Available</h3>
            <p className="mt-2 text-sm text-slate-400">
              Upload short videos (60 seconds or less) to start populating your
              feed.
            </p>
            <Link
              to="/upload"
              className="btn-primary mt-5 inline-flex items-center gap-2"
            >
              Upload a Short
            </Link>
          </div>
        ) : (
          <div className="relative flex h-full max-h-[750px] w-full max-w-[460px] items-center justify-center">
            {/* Main Video Reel Card */}
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              {currentShort?.isLocked ? (
                /* Subscribers-Only Locked Overlay */
                <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center">
                  <img
                    src={mediaUrl(currentShort.thumbnail)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover blur-lg brightness-[0.2]"
                  />
                  <div className="relative z-10 max-w-xs">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-red-500/30 bg-red-600/20 text-red-400 shadow-[0_0_25px_rgba(229,9,20,.4)]">
                      <Lock size={30} />
                    </div>
                    <span className="mt-4 inline-block rounded-full border border-red-400/30 bg-red-500/10 px-3 py-0.5 text-[11px] font-bold tracking-wider text-red-300">
                      SUBSCRIBERS ONLY
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-white">
                      Exclusive Short Premiere
                    </h3>
                    <p className="mt-1 text-xs text-slate-300">
                      Subscribe to @{currentShort.owner?.username} to unlock and
                      watch this reel.
                    </p>
                    <button
                      disabled={subscribingId === currentShort.owner?._id}
                      onClick={() =>
                        handleSubscribeToggle(
                          currentShort.owner?._id,
                          currentShort.owner?.username,
                        )
                      }
                      className="btn-primary mt-5 flex items-center gap-2 mx-auto text-xs py-2.5 px-4"
                    >
                      <UserPlus size={15} />
                      {subscribingId === currentShort.owner?._id
                        ? "Subscribing…"
                        : "Subscribe to Unlock"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Video Player */
                <div
                  onClick={handleTogglePlay}
                  className="relative h-full w-full cursor-pointer select-none bg-black"
                >
                  <video
                    ref={(el) => (videoRefs.current[currentIndex] = el)}
                    src={mediaUrl(currentShort.videoFile)}
                    poster={mediaUrl(currentShort.thumbnail)}
                    loop
                    playsInline
                    muted={muted}
                    className="h-full w-full object-cover"
                  />

                  {/* Play / Pause Indicator */}
                  {!isPlaying && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-[2px]">
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md">
                        <Play size={28} fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Top Controls: Sound Toggle & Index Indicator */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
                  {currentIndex + 1} / {shorts.length}
                </span>

                <button
                  onClick={() => setMuted(!muted)}
                  className="pointer-events-auto rounded-full bg-black/60 p-2.5 text-white backdrop-blur-md border border-white/10 transition hover:bg-black/80"
                  title={muted ? "Unmute (M)" : "Mute (M)"}
                >
                  {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
              </div>

              {/* Right Side Floating Action Column */}
              <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-5">
                {/* Like Button */}
                <button
                  onClick={() => handleToggleLike(currentShort)}
                  className="group flex flex-col items-center gap-1 text-white transition active:scale-125"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur-md transition ${
                      currentShort.isLiked
                        ? "bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(229,9,20,.5)]"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    <Heart
                      size={24}
                      fill={currentShort.isLiked ? "currentColor" : "none"}
                      className={currentShort.isLiked ? "scale-110" : ""}
                    />
                  </div>
                  <span className="text-xs font-bold drop-shadow-md">
                    {currentShort.likesCount || 0}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => setShowComments(true)}
                  className="group flex flex-col items-center gap-1 text-white transition hover:scale-105"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-black/60 backdrop-blur-md transition group-hover:bg-black/80">
                    <MessageCircle size={22} />
                  </div>
                  <span className="text-xs font-bold drop-shadow-md">
                    {currentShort.commentsCount || 0}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => handleShare(currentShort)}
                  className="group flex flex-col items-center gap-1 text-white transition hover:scale-105"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-black/60 backdrop-blur-md transition group-hover:bg-black/80">
                    <Share2 size={22} />
                  </div>
                  <span className="text-[11px] font-bold drop-shadow-md">
                    Share
                  </span>
                </button>

                {/* Save Button */}
                <button
                  onClick={() => handleToggleSave(currentShort)}
                  className="group flex flex-col items-center gap-1 text-white transition hover:scale-105"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur-md transition ${
                      currentShort.isSaved
                        ? "bg-brand/20 text-brand shadow-[0_0_20px_rgba(229,9,20,.4)]"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    <Bookmark
                      size={20}
                      fill={currentShort.isSaved ? "currentColor" : "none"}
                    />
                  </div>
                  <span className="text-[11px] font-bold drop-shadow-md">
                    {currentShort.isSaved ? "Saved" : "Save"}
                  </span>
                </button>
              </div>

              {/* Bottom Creator & Video Metadata Info */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5 pt-16">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/channel/${currentShort.owner?.username}`}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <img
                      src={mediaUrl(currentShort.owner?.avatar)}
                      alt={currentShort.owner?.username}
                      className="h-8 w-8 rounded-full object-cover border border-white/20"
                    />
                    <span className="font-extrabold text-white hover:underline text-sm truncate">
                      @{currentShort.owner?.username}
                    </span>
                  </Link>

                  {currentUser?._id !== currentShort.owner?._id && (
                    <button
                      disabled={subscribingId === currentShort.owner?._id}
                      onClick={() =>
                        handleSubscribeToggle(
                          currentShort.owner?._id,
                          currentShort.owner?.username,
                        )
                      }
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        currentShort.isSubscribed
                          ? "border border-white/20 bg-white/15 text-slate-200"
                          : "bg-brand text-white shadow-[0_0_12px_rgba(229,9,20,.5)] hover:bg-brand-hover"
                      }`}
                    >
                      {currentShort.isSubscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  )}
                </div>

                <p className="mt-2 text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                  {currentShort.title}
                </p>

                {currentShort.description && (
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                    {currentShort.description}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Music size={12} className="text-brand animate-pulse" />
                  <span className="truncate">
                    Original audio - @{currentShort.owner?.username}
                  </span>
                </div>
              </div>

              {/* Slide-Up Comments Drawer */}
              {showComments && (
                <div className="absolute inset-0 z-30 flex flex-col bg-[#0f0f0f]/95 backdrop-blur-2xl transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageCircle size={16} className="text-brand" />{" "}
                      Comments ({comments.length})
                    </h4>
                    <button
                      onClick={() => setShowComments(false)}
                      className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Comment List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-12">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      comments.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-start gap-3 text-xs"
                        >
                          <img
                            src={mediaUrl(c.owner?.avatar)}
                            alt={c.owner?.username}
                            className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                @{c.owner?.username}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-300 leading-relaxed">
                              {c.content}
                            </p>
                            {(currentUser?._id === c.owner?._id ||
                              currentUser?._id ===
                                currentShort?.owner?._id) && (
                              <div className="mt-2 flex gap-2 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(c._id);
                                    setEditText(c.content);
                                  }}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c._id)}
                                  className="text-red-300 hover:text-red-200"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                            {editingCommentId === c._id && (
                              <form
                                onSubmit={(e) => handleEditComment(e, c._id)}
                                className="mt-2 flex gap-2"
                              >
                                <input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="input flex-1 py-2 text-[11px]"
                                />
                                <button
                                  type="submit"
                                  className="btn-primary px-3 py-2 text-[10px]"
                                >
                                  Save
                                </button>
                              </form>
                            )}

                            <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyingTo((prev) =>
                                    prev?._id === c._id ? null : c,
                                  )
                                }
                                className="font-semibold text-red-300 hover:text-red-200"
                              >
                                Reply
                              </button>
                              {(c.replies || []).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedCommentIds((previous) => {
                                      const next = new Set(previous);
                                      next.has(c._id)
                                        ? next.delete(c._id)
                                        : next.add(c._id);
                                      return next;
                                    })
                                  }
                                  className="text-slate-400"
                                >
                                  {expandedCommentIds.has(c._id)
                                    ? "Hide"
                                    : "Show"}{" "}
                                  {c.replies.length} replies
                                </button>
                              )}
                            </div>

                            {replyingTo?._id === c._id && (
                              <form
                                onSubmit={(e) => handleReplySubmit(e, c)}
                                className="mt-2 flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to @${c.owner?.username}`}
                                  className="input py-2 text-[11px] flex-1 bg-white/5 border-white/15"
                                />
                                <button
                                  type="submit"
                                  disabled={
                                    submittingReplyId === c._id ||
                                    !replyText.trim()
                                  }
                                  className="btn-primary py-2 px-3 text-[10px]"
                                >
                                  {submittingReplyId === c._id ? "..." : "Send"}
                                </button>
                              </form>
                            )}

                            {(c.replies || []).length > 0 &&
                              expandedCommentIds.has(c._id) &&
                              renderReplies(c.replies)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <form
                    onSubmit={handleAddComment}
                    className="border-t border-white/10 p-3 flex items-center gap-2 bg-black/40"
                  >
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment…"
                      className="input py-2 text-xs flex-1 bg-white/5 border-white/15"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="btn-primary py-2 px-3 shrink-0"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Next / Prev Floating Navigation Arrows (Side of Card) */}
            <div className="absolute -right-16 hidden lg:flex flex-col gap-3">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-[#121212] text-white shadow-xl transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Short (Up)"
              >
                <ChevronUp size={24} />
              </button>

              <button
                onClick={goNext}
                disabled={currentIndex === shorts.length - 1}
                className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-[#121212] text-white shadow-xl transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Short (Down)"
              >
                <ChevronDown size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
