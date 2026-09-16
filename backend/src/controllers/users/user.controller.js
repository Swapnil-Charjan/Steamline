import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.models.js";
import { Video } from "../../models/video.models.js";
import { uploadOnCloudinary } from "../../config/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

//Get all users
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalUsers,
                    currentPage: page,
                    totalPages: Math.ceil(totalVideos / limit),
                    limit,
                },
            },
            "All users fetched successfully!"
        )
    );
});

//Update user account details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const {
        fullname,
        username,
        email,
        phone,
        bio,
        location,
        website,
        dateOfBirth,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    /*
     * Check username uniqueness
     */
    if (username && username.toLowerCase() !== user.username) {
        const existingUsername = await User.findOne({
            username: username.toLowerCase(),
            _id: { $ne: user._id },
        });

        if (existingUsername) {
            throw new ApiError(409, "Username is already taken");
        }
    }

    /*
     * Check email uniqueness
     */
    if (email && email.toLowerCase() !== user.email) {
        const existingEmail = await User.findOne({
            email: email.toLowerCase(),
            _id: { $ne: user._id },
        });

        if (existingEmail) {
            throw new ApiError(409, "Email is already in use");
        }
    }

    /*
     * Update fields
     */
    if (fullname !== undefined) {
        user.fullname = fullname.trim();
    }

    if (username !== undefined) {
        user.username = username.trim().toLowerCase();
    }

    if (email !== undefined) {
        user.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
        user.phone = phone.trim();
    }

    if (bio !== undefined) {
        user.bio = bio.trim();
    }

    if (location !== undefined) {
        user.location = location.trim();
    }

    if (website !== undefined) {
        user.website = website.trim();
    }

    if (dateOfBirth !== undefined) {
        user.dateOfBirth = dateOfBirth || null;
    }

    await user.save();

    /*
     * Never return password or refresh token
     */
    const updatedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "Account updated successfully")
        );
});

//Update user avatar photo
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing!..");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading file on cloudinary!..");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image uploaded successfully!..")
        );
});

//Update user cover photo
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing!..");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading file on cloudinary!..");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image uploaded successfully!..")
        );
});

//Get User channel profile details
const getUserchannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing!..");
    }

    const channel = await User.findOne({
        username: username.toLowerCase().trim(),
    }).select("-password -refreshToken");

    if (!channel) {
        throw new ApiError(404, "Channel not found!..");
    }

    const currentUser = req.user?._id
        ? await User.findById(req.user._id)
        : null;
    const isSubscribed =
        currentUser?.subscriptions?.some(
            (subId) => subId.toString() === channel._id.toString()
        ) || false;

    const channelData = {
        ...channel.toObject(),
        subscribersCount: channel.subscribersCount || 0,
        isSubscribed,
        isSelf: req.user?._id?.toString() === channel._id.toString(),
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                [channelData],
                "User channel profile fetched successfully!.."
            )
        );
});

const toggleSavedVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized user");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const alreadySaved = user.savedVideos.some(
        (savedId) => savedId.toString() === videoId
    );

    const update = alreadySaved
        ? { $pull: { savedVideos: videoId } }
        : { $addToSet: { savedVideos: videoId } };

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
        new: true,
    }).select("savedVideos");

    const isSaved = updatedUser.savedVideos.some(
        (savedId) => savedId.toString() === videoId
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videoId,
                isSaved,
                savedCount: updatedUser.savedVideos.length,
            },
            alreadySaved
                ? "Video removed from saved list"
                : "Video saved successfully"
        )
    );
});

const getSavedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized user");
    }

    const user = await User.findById(userId).populate({
        path: "savedVideos",
        populate: {
            path: "owner",
            select: "username fullname avatar subscribersCount",
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user.savedVideos,
                "Saved videos fetched successfully"
            )
        );
});

// Get watch history user videos
const getWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized user");
    }

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(userId)),
            },
        },
        {
            $unwind: {
                path: "$watchHistory",
                includeArrayIndex: "watchIndex",
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$video",
            },
        },
        {
            $sort: {
                watchIndex: 1,
            },
        },
        {
            $replaceRoot: {
                newRoot: "$video",
            },
        },
        {
            $limit: 5,
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Watch history fetched successfully!")
        );
});

export {
    getAllUsers,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserchannelProfile,
    getWatchHistory,
    toggleSavedVideo,
    getSavedVideos,
};
