import { Router } from "express";
import {
    subscribeChannel,
    unsubscribeChannel,
} from "../controllers/subscriptions/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/subscribe/:channelId").post(verifyJWT, subscribeChannel);
router.route("/unsubscribe/:channelId").post(verifyJWT, unsubscribeChannel);

export default router;
