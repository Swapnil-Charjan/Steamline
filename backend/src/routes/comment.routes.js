import { Router } from "express";
import {
    getVideoComments,
    addVideoComment,
    addReplyToComment,
    updateComment,
    deleteComment,
} from "../controllers/comments/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
    .route("/:videoId")
    .get(verifyJWT, getVideoComments)
    .post(verifyJWT, addVideoComment);

router.post("/:videoId/:commentId/reply", verifyJWT, addReplyToComment);
router.patch("/:videoId/:commentId", verifyJWT, updateComment);
router.delete("/:videoId/:commentId", verifyJWT, deleteComment);

export default router;
