import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Video } from "../../models/video.models.js";
import { Comment } from "../../models/comment.models.js";

// const addVideoComment = asyncHandler(async (req, res) => {
//     const { videoId } = req.params;

//     const { content } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(videoId)) {
//         throw new ApiError(400, "Invalid video ID");
//     }

//     if (!content || !content.trim()) {
//         throw new ApiError(400, "Comment content cannot be empty");
//     }

//     const video = await Video.findById(videoId);

//     if (!video) {
//         throw new ApiError(404, "Video not found");
//     }

//     const comment = await Comment.create({
//         content: content.trim(),

//         video: videoId,

//         owner: req.user._id,
//     });

//     await Video.findByIdAndUpdate(videoId, {
//         $inc: {
//             commentsCount: 1,
//         },
//     });

//     // Reply to a video comment
//     const replyToComment = asyncHandler(async (req, res) => {
//         const { videoId, commentId } = req.params;
//         const { content } = req.body;

//         if (!mongoose.Types.ObjectId.isValid(videoId)) {
//             throw new ApiError(400, "Invalid video ID");
//         }

//         if (!mongoose.Types.ObjectId.isValid(commentId)) {
//             throw new ApiError(400, "Invalid comment ID");
//         }

//         if (!content || !content.trim()) {
//             throw new ApiError(400, "Reply content cannot be empty");
//         }

//         // Check video
//         const video = await Video.findById(videoId).select("owner");

//         if (!video) {
//             throw new ApiError(404, "Video not found");
//         }

//         // Check parent comment
//         const parentComment = await Comment.findOne({
//             _id: commentId,
//             video: videoId,
//         }).populate("owner", "username fullname avatar");

//         if (!parentComment) {
//             throw new ApiError(404, "Comment not found for this video");
//         }

//         // Current user
//         const currentUser = await User.findById(req.user._id).select(
//             "username fullname avatar"
//         );

//         if (!currentUser) {
//             throw new ApiError(404, "User not found");
//         }

//         // ============================================================
//         // Reply on Video Comment
//         // ============================================================
//         const replyContent = content.trim();

//         const mentionedUsername = parentComment.owner?.username;

//         const alreadyMentioned =
//             mentionedUsername &&
//             new RegExp(`@${mentionedUsername}\\b`, "i").test(replyContent);

//         const finalContent =
//             mentionedUsername && !alreadyMentioned
//                 ? `@${mentionedUsername} ${replyContent}`
//                 : replyContent;

//         const reply = await Comment.create({
//             content: finalContent,
//             video: videoId,
//             owner: req.user._id,
//             parentComment: parentComment._id,
//             replyTo: parentComment.owner?._id,
//         });

//         // Increment video comment count
//         await Video.findByIdAndUpdate(videoId, {
//             $inc: {
//                 commentsCount: 1,
//             },
//         });

//         const populatedReply = await Comment.findById(reply._id)
//             .populate("owner", "username fullname avatar")
//             .populate("replyTo", "username fullname avatar");

//         return res
//             .status(201)
//             .json(
//                 new ApiResponse(201, populatedReply, "Reply added successfully")
//             );
//     });

//     const populatedComment = await Comment.findById(comment._id).populate(
//         "owner",
//         "username fullname avatar"
//     );

//     return res
//         .status(201)
//         .json(
//             new ApiResponse(201, populatedComment, "Comment added successfully")
//         );
// });

// Get Video Comments
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const commentDocuments = await Comment.find({ video: videoId })
        .populate("owner", "username fullname avatar")
        .populate("replyTo", "username fullname avatar")
        .sort({ createdAt: 1 });

    const commentsById = new Map(
        commentDocuments.map((comment) => [
            comment._id.toString(),
            { ...comment.toObject(), replies: [] },
        ])
    );

    const comments = [];
    for (const comment of commentsById.values()) {
        const parentId = comment.parentComment?.toString();
        if (parentId && commentsById.has(parentId)) {
            commentsById.get(parentId).replies.push(comment);
        } else if (!parentId) {
            comments.push(comment);
        }
    }

    comments.sort((first, second) => second.createdAt - first.createdAt);

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const canManageComment = (comment, video, userId) =>
    (comment.owner?._id || comment.owner)?.toString() === userId.toString() ||
    (video.owner?._id || video.owner)?.toString() === userId.toString();

const updateComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    const content = req.body.content?.trim();
    if (!content) throw new ApiError(400, "Comment content cannot be empty");

    const [video, comment] = await Promise.all([
        Video.findById(videoId).select("_id owner"),
        Comment.findOne({ _id: commentId, video: videoId }).populate(
            "owner",
            "username fullname avatar"
        ),
    ]);
    if (!video) throw new ApiError(404, "Video not found");
    if (!comment) throw new ApiError(404, "Comment not found");
    if (!canManageComment(comment, video, req.user._id)) {
        throw new ApiError(403, "You cannot edit this comment");
    }

    comment.content = content;
    await comment.save();
    const updatedComment = await Comment.findById(comment._id)
        .populate("owner", "username fullname avatar")
        .populate("replyTo", "username fullname avatar");
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    const [video, comment] = await Promise.all([
        Video.findById(videoId).select("_id owner"),
        Comment.findOne({ _id: commentId, video: videoId }),
    ]);
    if (!video) throw new ApiError(404, "Video not found");
    if (!comment) throw new ApiError(404, "Comment not found");
    if (!canManageComment(comment, video, req.user._id)) {
        throw new ApiError(403, "You cannot delete this comment");
    }

    const commentIds = [comment._id];
    for (let index = 0; index < commentIds.length; index += 1) {
        const children = await Comment.find({
            parentComment: commentIds[index],
        }).select("_id");
        commentIds.push(...children.map((child) => child._id));
    }
    await Comment.deleteMany({ _id: { $in: commentIds } });
    await Video.findByIdAndUpdate(videoId, {
        $inc: { commentsCount: -commentIds.length },
    });
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

// Add Reply to Comment
const addReplyToComment = asyncHandler(async (req, res) => {
    const { videoId, commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Reply content cannot be empty");
    }

    const video = await Video.findById(videoId).select("_id");
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const parentComment = await Comment.findOne({
        _id: commentId,
        video: videoId,
    }).populate("owner", "username fullname avatar");

    if (!parentComment) {
        throw new ApiError(404, "Comment not found for this video");
    }

    const ownerUsername = parentComment.owner?.username;
    const trimmedContent = content.trim();
    const ownerMention = ownerUsername ? `@${ownerUsername}` : "";
    const alreadyMentioned =
        ownerMention &&
        new RegExp(
            `(^|\\s)${ownerMention.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?=\\s|$)`,
            "i"
        ).test(trimmedContent);

    const reply = await Comment.create({
        content:
            ownerMention && !alreadyMentioned
                ? `${ownerMention} ${trimmedContent}`
                : trimmedContent,
        video: videoId,
        owner: req.user._id,
        parentComment: parentComment._id,
        replyTo: parentComment.owner?._id || null,
    });

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            commentsCount: 1,
        },
    });

    const populatedReply = await Comment.findById(reply._id)
        .populate("owner", "username fullname avatar")
        .populate("replyTo", "username fullname avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedReply, "Reply added successfully"));
});

// Add Video Comment
const addVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const video = await Video.findById(videoId).select("_id");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id,
        parentComment: null,
        replyTo: null,
    });

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            commentsCount: 1,
        },
    });

    const populatedComment = await Comment.findById(comment._id).populate(
        "owner",
        "username fullname avatar"
    );

    return res
        .status(201)
        .json(
            new ApiResponse(201, populatedComment, "Comment added successfully")
        );
});

export {
    getVideoComments,
    addVideoComment,
    addReplyToComment,
    updateComment,
    deleteComment,
};
