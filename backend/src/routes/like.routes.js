import { Router } from "express";
import { toggleVideoLike } from "../controllers/likes/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:videoId", verifyJWT, toggleVideoLike);

export default router;
