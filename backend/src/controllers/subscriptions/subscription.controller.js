import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.models.js";

//Subscribe Controller
const subscribeChannel = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const alreadySubscribed = await User.findOne({
        _id: userId,
        subscriptions: channelId,
    });

    if (alreadySubscribed) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isSubscribed: true },
                    "Already subscribed"
                )
            );
    }

    await User.findByIdAndUpdate(userId, {
        $addToSet: { subscriptions: channelId },
    });

    const updatedChannel = await User.findByIdAndUpdate(
        channelId,
        { $inc: { subscribersCount: 1 } },
        { new: true }
    ).select("subscribersCount");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isSubscribed: true,
                subscribersCount: updatedChannel?.subscribersCount || 0,
            },
            "Subscribed successfully"
        )
    );
});

//UnsubscribeChannel
const unsubscribeChannel = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    await User.findByIdAndUpdate(userId, {
        $pull: { subscriptions: channelId },
    });

    const updatedChannel = await User.findByIdAndUpdate(
        channelId,
        { $inc: { subscribersCount: -1 } },
        { new: true }
    ).select("subscribersCount");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isSubscribed: false,
                subscribersCount: Math.max(
                    0,
                    updatedChannel?.subscribersCount || 0
                ),
            },
            "Unsubscribed successfully"
        )
    );
});

export { subscribeChannel, unsubscribeChannel };
