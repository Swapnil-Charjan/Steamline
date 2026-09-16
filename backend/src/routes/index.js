import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import videoRoutes from "./video.routes.js";
import commentRoutes from "./comment.routes.js";
import likeRoutes from "./like.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import searchRoutes from "./search.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/videos", videoRoutes);
router.use("/comments", commentRoutes);
router.use("/likes", likeRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/search", searchRoutes);

export default router;
