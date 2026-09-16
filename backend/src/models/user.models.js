import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            minlength: [3, "Username must be at least 3 characters"],
            maxlength: [30, "Username cannot exceed 30 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },

        fullname: {
            type: String,
            required: [true, "Fullname is required"],
            trim: true,
            maxlength: [100, "Fullname cannot exceed 100 characters"],
            index: true,
        },

        avatar: {
            type: String,
            required: [true, "Avatar is required"],
            trim: true,
        },

        coverImage: {
            type: String,
            trim: true,
        },

        /*
         * Profile information
         */
        phone: {
            type: String,
            trim: true,
            maxlength: [20, "Phone number cannot exceed 20 characters"],
        },

        bio: {
            type: String,
            trim: true,
            maxlength: [500, "Bio cannot exceed 500 characters"],
        },

        location: {
            type: String,
            trim: true,
            maxlength: [100, "Location cannot exceed 100 characters"],
        },

        website: {
            type: String,
            trim: true,
            maxlength: [200, "Website cannot exceed 200 characters"],
        },

        dateOfBirth: {
            type: Date,
        },

        /*
         * User activity
         */
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        savedVideos: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],

        subscriptions: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        subscribersCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        /*
         * Authentication
         */
        password: {
            type: String,
            required: [true, "Password is required"],
        },

        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    //Bcrypt password
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    //compare password
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
