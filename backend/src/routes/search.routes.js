import { Router } from "express";
import { searchChannels } from "../controllers/search/search.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/search").get(verifyJWT, searchChannels);

export default router;
