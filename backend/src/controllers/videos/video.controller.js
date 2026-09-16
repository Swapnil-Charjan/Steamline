import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.models.js";
import { Video } from "../../models/video.models.js";
import { Like } from "../../models/like.models.js";
import mongoose from "mongoose";
import { getPagination } from "../../utils/pagination.js";
import { buildVideoQuery, getVideoSort } from "../../utils/videoFilters.js";

//Upload Video
const uploadVideos = asyncHandler(async (req, res) => {
    const { title, description, duration, isSubscribersOnly, isShort } =
        req.body;

    if (!title || !description || !duration) {
        throw new ApiError(
            400,
            "Title, description, and duration are required!"
        );
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    //Check videoFile required
    if (!videoFilePath) {
        throw new ApiError(400, "Video file is required");
    }

    //Check thumbnail required
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const isSubOnly =
        isSubscribersOnly === true ||
        isSubscribersOnly === "true" ||
        isSubscribersOnly === 1 ||
        isSubscribersOnly === "1";

    const isShortVideo =
        isShort === true ||
        isShort === "true" ||
        isShort === 1 ||
        isShort === "1" ||
        Number(duration) <= 60;

    const video = await Video.create({
        videoFile: videoFilePath,
        thumbnail: thumbnailPath,
        title,
        description,
        duration: Number(duration),
        isSubscribersOnly: isSubOnly,
        isShort: isShortVideo,
        owner: req.user?._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(200, video, "Video uploaded successfully.!"));
});

//Get login user video
const getMyVideos = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query, 12);
    const userId = req.user._id;
    const filter = buildVideoQuery(req.query, { owner: userId });

    const totalVideos = await Video.countDocuments(filter);

    const videos = await Video.find(filter)
        .sort(getVideoSort(req.query.sortBy, req.query.sortOrder))
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalVideos,
                    page,
                    limit,
                    totalPages: Math.ceil(totalVideos / limit),
                },
            },
            "My videos fetched successfully!"
        )
    );
});

//Get video details
const getVideoDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(id).populate(
        "owner",
        "username fullname avatar coverImage subscribersCount"
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const currentUserId = req.user?._id?.toString();
    const ownerId = video.owner?._id?.toString();
    const isOwner = Boolean(
        currentUserId && ownerId && currentUserId === ownerId
    );

    // Check if current user is subscribed to the video owner
    const currentUser = req.user?._id
        ? await User.findById(req.user._id)
        : null;
    const isSubscribed =
        currentUser?.subscriptions?.some(
            (subId) => subId.toString() === ownerId
        ) || false;
    const isSaved =
        currentUser?.savedVideos?.some(
            (savedId) => savedId.toString() === id
        ) || false;

    // Check if the video is restricted to subscribers
    const isLocked = Boolean(
        video.isSubscribersOnly && !isOwner && !isSubscribed
    );

    if (!isLocked) {
        // Increment view and add to history only if accessible
        await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });
        if (req.user?._id) {
            await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { watchHistory: video._id },
            });
        }
    }

    const videoData = video.toObject();
    if (isLocked) {
        videoData.videoFile = null; // Guard media stream from unauthorized viewers
        videoData.isLocked = true;
    } else {
        videoData.isLocked = false;
    }

    videoData.isSubscribed = isSubscribed;
    videoData.isOwner = isOwner;
    videoData.isSaved = isSaved;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoData,
                "Video details fetched successfully"
            )
        );
});

//getVideosOfAnyChannel
const getUserVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page, limit, skip } = getPagination(req.query, 18);

    // Validate user ID
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const ownerId = new mongoose.Types.ObjectId(userId);

    const filter = {
        owner: ownerId,
        isPublished: true,
    };

    const queryFilter = buildVideoQuery(req.query, filter);

    const totalVideos = await Video.countDocuments(queryFilter);

    const videos = await Video.find(queryFilter)
        .sort(getVideoSort(req.query.sortBy, req.query.sortOrder))
        .skip(skip)
        .limit(limit)
        .populate("owner", "username fullname avatar subscribersCount")
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalVideos,
                    page,
                    limit,
                    totalPages: Math.ceil(totalVideos / limit),
                },
            },
            "Channel videos fetched successfully"
        )
    );
});

// Get random/feed Shorts
const getShortsFeed = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id?.toString();
    const currentUser = req.user?._id
        ? await User.findById(req.user._id)
        : null;
    const currentUserSubs =
        currentUser?.subscriptions?.map((id) => id.toString()) || [];

    const shortFilter = {
        isPublished: true,
        $or: [{ isShort: true }, { duration: { $lte: 60 } }],
    };

    if (currentUserId) {
        const subscriberOwnerIds = currentUserSubs.map(
            (id) => new mongoose.Types.ObjectId(id)
        );

        shortFilter.$and = [
            {
                $or: [
                    { isSubscribersOnly: false },
                    { isSubscribersOnly: { $exists: false } },
                    { owner: { $in: subscriberOwnerIds } },
                ],
            },
        ];
    } else {
        shortFilter.isSubscribersOnly = false;
    }

    let shorts = await Video.find(shortFilter)
        .populate(
            "owner",
            "username fullname avatar coverImage subscribersCount"
        )
        .limit(30)
        .sort({ createdAt: -1 });

    if (shorts.length < 5) {
        const fallbackFilter = {
            isPublished: true,
            _id: { $nin: shorts.map((s) => s._id) },
            $or: [{ isShort: true }, { duration: { $lte: 60 } }],
        };

        if (currentUserId) {
            fallbackFilter.$or = [
                { isSubscribersOnly: false },
                { isSubscribersOnly: { $exists: false } },
                {
                    owner: {
                        $in: currentUserSubs.map(
                            (id) => new mongoose.Types.ObjectId(id)
                        ),
                    },
                },
            ];
        } else {
            fallbackFilter.isSubscribersOnly = false;
        }

        const otherVideos = await Video.find(fallbackFilter)
            .populate(
                "owner",
                "username fullname avatar coverImage subscribersCount"
            )
            .limit(20)
            .sort({ createdAt: -1 });

        shorts = [...shorts, ...otherVideos];
    }

    shorts = shorts.sort(() => 0.5 - Math.random());

    const userLikes = req.user?._id
        ? await Like.find({
              likedBy: req.user._id,
              video: { $in: shorts.map((s) => s._id) },
          }).select("video")
        : [];

    const likedVideoIds = new Set(userLikes.map((l) => l.video.toString()));
    const savedVideoIds = new Set(
        currentUser?.savedVideos?.map((savedId) => savedId.toString()) || []
    );

    const enrichedShorts = shorts.map((video) => {
        const ownerId = video.owner?._id?.toString();
        const isOwner = currentUserId === ownerId;
        const isSubscribed = currentUserSubs.includes(ownerId);
        const isLocked = Boolean(
            video.isSubscribersOnly && !isOwner && !isSubscribed
        );
        const isLiked = likedVideoIds.has(video._id.toString());
        const isSaved = savedVideoIds.has(video._id.toString());

        const videoObj = video.toObject();
        if (isLocked) {
            videoObj.videoFile = null; // protect media stream
            videoObj.isLocked = true;
        } else {
            videoObj.isLocked = false;
        }

        videoObj.isLiked = isLiked;
        videoObj.isSaved = isSaved;
        videoObj.isSubscribed = isSubscribed;
        videoObj.isOwner = isOwner;
        return videoObj;
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                enrichedShorts,
                "Shorts feed fetched successfully"
            )
        );
});

export {
    uploadVideos,
    getMyVideos,
    getVideoDetails,
    getUserVideos,
    getShortsFeed,
};
