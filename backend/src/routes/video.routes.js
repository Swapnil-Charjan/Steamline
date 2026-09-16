import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    uploadVideos,
    getMyVideos,
    getVideoDetails,
    getUserVideos,
    getShortsFeed,
} from "../controllers/videos/video.controller.js";

const router = Router();

router.route("/uploadVideo").post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    uploadVideos
);
router.route("/my-videos").get(verifyJWT, getMyVideos);
router.route("/getVideoDetails/:id").get(verifyJWT, getVideoDetails);
router.route("/channel/:userId/videos").get(verifyJWT, getUserVideos);
router.route("/shorts").get(verifyJWT, getShortsFeed);

export default router;
