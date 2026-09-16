import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
       const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017";
       if (!mongoUrl.startsWith("mongodb://") && !mongoUrl.startsWith("mongodb+srv://")) {
           throw new Error("MONGODB_URL must start with mongodb:// or mongodb+srv://");
       }
       const connectionInstance = await mongoose.connect(
           `${mongoUrl.replace(/\/$/, "")}/${DB_NAME}`
       );
       console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED", error)
        process.exit(1);
    }
}

export default connectDB;