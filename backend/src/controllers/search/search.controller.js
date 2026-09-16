import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.models.js";
import { Video } from "../../models/video.models.js";
import { getPagination } from "../../utils/pagination.js";
import { buildVideoQuery, getVideoSort } from "../../utils/videoFilters.js";

// Search channels and videos
const searchChannels = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const { page, limit, skip } = getPagination(req.query, 12);

    // Validate search query
    if (!q || !q.trim()) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    channels: [],
                    videos: [],
                },
                "Empty search query"
            )
        );
    }

    const keyword = q.trim();

    // Escape regex special characters
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedKeyword, "i");

    // Find matching channels
    const channels = await User.find({
        $or: [{ username: { $regex: regex } }, { fullname: { $regex: regex } }],
    })
        .select("username fullname avatar coverImage subscribersCount")
        .limit(20)
        .lean();

    // Current user subscription information
    let currentUserId = null;
    let currentUserSubs = [];

    if (req.user?._id) {
        const currentUser = await User.findById(req.user._id)
            .select("_id subscriptions")
            .lean();

        if (currentUser) {
            currentUserId = currentUser._id.toString();

            currentUserSubs =
                currentUser.subscriptions?.map((id) => id.toString()) || [];
        }
    }

    // Add videos and subscription status to each channel
    const channelsWithVideos = await Promise.all(
        channels.map(async (channel) => {
            const channelVideos = await Video.find({
                owner: channel._id,
                isPublished: true,
            })
                .sort({ createdAt: -1 })
                .limit(6)
                .populate("owner", "username fullname avatar subscribersCount")
                .lean();

            const channelId = channel._id.toString();

            return {
                ...channel,
                isSubscribed: currentUserSubs.includes(channelId),
                isSelf: currentUserId === channelId,
                videos: channelVideos,
            };
        })
    );

    // Search published videos
    const videoFilter = buildVideoQuery(
        req.query,
        {
            isPublished: true,
            $or: [{ title: { $regex: regex } }, { description: { $regex: regex } }],
        },
    );
    const totalVideos = await Video.countDocuments(videoFilter);
    const videos = await Video.find(videoFilter)
        .populate("owner", "username fullname avatar subscribersCount")
        .sort(getVideoSort(req.query.sortBy, req.query.sortOrder))
        .skip(skip)
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                channels: channelsWithVideos,
                videos,
                pagination: {
                    totalVideos,
                    page,
                    limit,
                    totalPages: Math.ceil(totalVideos / limit),
                },
            },
            "Search results fetched successfully"
        )
    );
});

export { searchChannels };
