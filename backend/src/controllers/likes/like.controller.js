import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Video } from "../../models/video.models.js";
import { Like } from "../../models/like.models.js";
import mongoose from "mongoose";

// Toggle Like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    let isLiked = false;
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: -1 } });
        isLiked = false;
    } else {
        await Like.create({
            video: videoId,
            likedBy: userId,
        });
        await Video.findByIdAndUpdate(videoId, { $inc: { likesCount: 1 } });
        isLiked = true;
    }

    const updatedVideo = await Video.findById(videoId).select("likesCount");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isLiked,
                likesCount: Math.max(0, updatedVideo?.likesCount || 0),
            },
            isLiked ? "Video liked" : "Video unliked"
        )
    );
});

export { toggleVideoLike };
