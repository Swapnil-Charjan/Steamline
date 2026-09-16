import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { ApiError } from "./utils/ApiError.js";

// Routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import searchRoute from "./routes/search.routes.js";

const app = express();

// Request Logger
app.use((req, res, next) => {
    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );
    next();
});

// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Allow requests without Origin header
            // Example: Postman, curl, backend-to-backend requests
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(
                new Error(`Origin ${origin} is not allowed by CORS`)
            );
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

//|Body Parsers
app.use(express.json({ limit: "200MB" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "200MB",
    })
);

// Static Files
app.use(express.static("public"));

// Cookie Parser
app.use(cookieParser());

// API Routes
// Base API URL: /api/v1
const API_VERSION = "/api/v1";

// Authentication Routes
app.use(`${API_VERSION}/auth`, authRouter);
app.use(`${API_VERSION}/users`, userRouter);
app.use(`${API_VERSION}/videos`, videoRouter);
app.use(`${API_VERSION}/comments`, commentRouter);
app.use(`${API_VERSION}/likes`, likeRouter);
app.use(`${API_VERSION}/subscriptions`, subscriptionRouter);
app.use(`${API_VERSION}/search`, searchRoute);

//Root
app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "StreamLine API is running",
    });
});

// Health Check
app.get(`${API_VERSION}/health`, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "API is running",
        version: "v1",
    });
});

// 404 Handler
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("API Error:", err);
    // CORS Error
    if (err.message?.includes("not allowed by CORS")) {
        return res.status(403).json({
            success: false,
            message: err.message,
        });
    }

    // Custom ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data,
        });
    }

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        const errorMessages = Object.values(err.errors).map(
            (error) => error.message
        );

        return res.status(400).json({
            success: false,
            message: errorMessages.join(", "),
        });
    }

    // Mongoose Cast Error
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }

    // Duplicate MongoDB Key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];

        return res.status(409).json({
            success: false,
            message: `${field || "Field"} already exists`,
        });
    }

    // JWT / Authentication Errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token",
        });
    }

    // Multer Errors
    if (err.name === "MulterError") {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Default Error
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

export { app };
