import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllUsers,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserchannelProfile,
    getWatchHistory,
    toggleSavedVideo,
    getSavedVideos,
} from "../controllers/users/user.controller.js";

const router = Router();

router.route("/all-users").get(verifyJWT, getAllUsers);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/c/:username").get(verifyJWT, getUserchannelProfile);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);
router.route("/saved-videos").get(verifyJWT, getSavedVideos);
router.route("/save-video/:videoId").post(verifyJWT, toggleSavedVideo);
router
    .route("/update-avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/update-cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export default router;
