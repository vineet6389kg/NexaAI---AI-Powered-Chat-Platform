import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        mimeType: String,
        data: String, // base64, already shrunk by the frontend
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ThreadSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    threadId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        default: "New Chat",
    },
    messages: [MessageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: Date // only set for guest chats; MongoDB deletes them automatically
});

// delete the document when expiresAt is reached
ThreadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Thread", ThreadSchema);