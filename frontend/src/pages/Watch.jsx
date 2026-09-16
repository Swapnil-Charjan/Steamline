import {
  Check,
  Eye,
  Lock,
  MessageCircle,
  Pencil,
  Send,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { videoService } from "../services/video.service";
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

export default function Watch() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [expandedCommentIds, setExpandedCommentIds] = useState(new Set());

  const fetchVideo = async () => {
    try {
      const res = await videoService.details(id);
      setVideo(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [id]);

  useEffect(() => {
    if (!video?._id) return;
    commentService
      .getComments(video._id)
      .then((res) => setComments(res.data || []))
      .catch((err) => console.error("Failed to load comments:", err));
  }, [video?._id]);

  const handleToggleSave = async () => {
    if (!video?._id) return;
    const previousSave = Boolean(video.isSaved);
    setVideo((prev) => (prev ? { ...prev, isSaved: !previousSave } : prev));

    try {
      const res = await userService.toggleSaveVideo(video._id);
      setVideo((prev) =>
        prev
          ? { ...prev, isSaved: Boolean(res.data?.isSaved ?? !previousSave) }
          : prev,
      );
    } catch (err) {
      console.error("Save toggle failed:", err);
      setVideo((prev) => (prev ? { ...prev, isSaved: previousSave } : prev));
      toast.error(
        err?.response?.data?.message || "Unable to update saved list",
      );
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !video?._id) return;

    setSubmittingComment(true);
    try {
      const res = await commentService.addComment(
        video._id,
        commentText.trim(),
      );
      setComments((prev) => [res.data, ...prev]);
      setCommentText("");
      toast.success("Comment posted!");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Unable to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (e, targetComment) => {
    e.preventDefault();
    if (!replyText.trim() || !video?._id) return;

    setSubmittingReplyId(targetComment._id);
    try {
      const res = await commentService.replyToComment(
        video._id,
        targetComment._id,
        replyText.trim(),
      );

      setComments((prev) => appendReply(prev, targetComment._id, res.data));
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply posted!");
    } catch (err) {
      console.error(err);
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
          <p className="mt-1 text-sm text-slate-200">{reply.content}</p>
          {(reply.owner?._id === currentUser?._id || video?.isOwner) && (
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
                className="input flex-1 py-2 text-xs"
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
            className="mt-2 text-[10px] font-semibold text-red-300"
          >
            Reply
          </button>
          {replyingTo?._id === reply._id && (
            <form
              onSubmit={(e) => handleReplySubmit(e, reply)}
              className="mt-2 flex gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${reply.owner?.username}`}
                className="input flex-1 py-2 text-xs bg-white/5 border-white/15"
              />
              <button
                type="submit"
                disabled={submittingReplyId === reply._id || !replyText.trim()}
                className="btn-primary py-2 px-3 text-[10px]"
              >
                {submittingReplyId === reply._id ? "..." : <Send size={14} />}
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
        video._id,
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
      await commentService.deleteComment(video._id, commentId);
      setComments((prev) => removeCommentTree(prev, commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete comment");
    }
  };

  if (!video)
    return (
      <Layout>
        <div className="flex h-72 items-center justify-center">
          <p className="text-slate-400">Loading premiere…</p>
        </div>
      </Layout>
    );

  const handleSubscribeToggle = async () => {
    if (!video.owner?._id) return;
    setSubscribing(true);
    try {
      if (video.isSubscribed) {
        await subscribeService.unsubscribe(video.owner._id);
        toast.success(`Unsubscribed from @${video.owner.username}`);
      } else {
        await subscribeService.subscribe(video.owner._id);
        toast.success(`Subscribed to @${video.owner.username}!`);
      }
      // Re-fetch video details to refresh access & subscriber status
      await fetchVideo();
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        {/* Video Player / Locked Screen */}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl">
          {video.isLocked ? (
            <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center">
              {/* Blurred Thumbnail Background */}
              <img
                src={mediaUrl(video.thumbnail)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover blur-md brightness-[0.25]"
              />

              <div className="relative z-10 max-w-md">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-red-400/30 bg-red-600/20 text-red-400 shadow-[0_0_30px_rgba(229,9,20,.35)] backdrop-blur-md">
                  <Lock size={32} />
                </div>

                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-red-300">
                  <Sparkles size={13} /> Subscribers-Only Premiere
                </span>

                <h2 className="mt-3 text-2xl font-extrabold text-white">
                  Exclusive Creator Content
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  This video is exclusively available to subscribers of{" "}
                  <span className="font-semibold text-white">
                    @{video.owner?.username}
                  </span>
                  . Subscribe to unlock and watch immediately.
                </p>

                <button
                  disabled={subscribing}
                  onClick={handleSubscribeToggle}
                  className="btn-primary mt-6 mx-auto flex items-center gap-2 shadow-[0_0_25px_rgba(229,9,20,.5)]"
                >
                  <UserPlus size={18} />
                  {subscribing
                    ? "Subscribing…"
                    : `Subscribe to @${video.owner?.username} to Watch`}
                </button>
              </div>
            </div>
          ) : (
            <video
              className="h-full w-full"
              controls
              autoPlay
              poster={mediaUrl(video.thumbnail)}
              src={mediaUrl(video.videoFile)}
            />
          )}
        </div>

        {/* Video Info Header */}
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {video.isSubscribersOnly && (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300">
                  <Lock size={12} /> Subscribers Only
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
              {video.title}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
              video.isSaved
                ? "border-brand bg-brand/15 text-brand"
                : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            {video.isSaved ? "Saved" : "Save"}
          </button>
        </div>

        {/* Creator Channel Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link to={`/channel/${video.owner?.username}`}>
              <img
                className="h-12 w-12 rounded-xl object-cover border border-white/20 transition hover:scale-105"
                src={mediaUrl(video.owner?.avatar)}
                alt=""
              />
            </Link>
            <div>
              <Link
                to={`/channel/${video.owner?.username}`}
                className="text-base font-bold text-white hover:text-red-400 transition"
              >
                {video.owner?.fullname || video.owner?.username || "Creator"}
              </Link>
              <p className="text-xs text-slate-400">
                @{video.owner?.username} · {video.owner?.subscribersCount || 0}{" "}
                subscribers
              </p>
            </div>
          </div>

          {!video.isOwner && (
            <button
              disabled={subscribing}
              onClick={handleSubscribeToggle}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                video.isSubscribed
                  ? "border border-white/20 bg-white/10 text-slate-200 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
                  : "bg-brand text-white shadow-[0_0_20px_rgba(229,9,20,.4)] hover:bg-brand-hover hover:scale-105"
              }`}
            >
              {video.isSubscribed ? (
                <>
                  <UserCheck size={17} /> Subscribed
                </>
              ) : (
                <>
                  <UserPlus size={17} /> Subscribe
                </>
              )}
            </button>
          )}
        </div>

        {/* Views & Timestamp */}
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <Eye size={17} />
          {video.views || 0} views ·{" "}
          {new Date(video.createdAt).toLocaleDateString()}
        </p>

        {/* Description */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {video.description}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="text-brand" size={18} />
            <h3 className="text-lg font-bold text-white">
              Public comments ({comments.length})
            </h3>
          </div>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400">No public comments yet.</p>
            ) : (
              comments.map((c) => (
                <div
                  key={c._id}
                  className="rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={mediaUrl(c.owner?.avatar)}
                      alt={c.owner?.username}
                      className="h-8 w-8 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">
                        @{c.owner?.username}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-200">{c.content}</p>
                  {(c.owner?._id === video?.owner?._id || video?.isOwner) && (
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
                        className="input flex-1 py-2 text-xs"
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
                      setReplyingTo((prev) => (prev?._id === c._id ? null : c))
                    }
                    className="mt-2 text-[11px] font-bold text-red-300"
                  >
                    Reply
                  </button>

                  {replyingTo?._id === c._id && (
                    <form
                      onSubmit={(e) => handleReplySubmit(e, c)}
                      className="mt-3 flex gap-2"
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to @${c.owner?.username}`}
                        className="input flex-1 py-2 text-xs bg-white/5 border-white/15"
                      />
                      <button
                        type="submit"
                        disabled={
                          submittingReplyId === c._id || !replyText.trim()
                        }
                        className="btn-primary py-2 px-3 text-[10px]"
                      >
                        {submittingReplyId === c._id ? (
                          "..."
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </form>
                  )}

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
                      className="mt-2 text-[11px] text-slate-400"
                    >
                      {expandedCommentIds.has(c._id) ? "Hide" : "Show"}{" "}
                      {c.replies.length} replies
                    </button>
                  )}
                  {(c.replies || []).length > 0 &&
                    expandedCommentIds.has(c._id) && (
                      <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                        {renderReplies(c.replies)}
                      </div>
                    )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="mt-5 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a public comment…"
              className="input flex-1 py-2.5 text-sm bg-white/5 border-white/15"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="btn-primary py-2.5 px-3"
            >
              {submittingComment ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
