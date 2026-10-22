import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'node:dns';
import chatRouter from './routes/Chat.js';
import authRouter from './routes/Auth.js';
import paymentRouter from './routes/Payment.js';
import requireAuth from './middleware/auth.js';
import usageLimit from './middleware/usage.js';

const app = express();
const PORT = process.env.PORT || 8080; // Render sets PORT by itself

app.set("trust proxy", 1); // needed for rate limiting behind Render
app.use(express.json({ limit: "5mb" })); // images are sent as base64

// CLIENT_URL = your Vercel link (separate several with commas, no trailing slash).
// If it is empty (for example on your laptop), any site may call the API.
const allowed = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : true }));

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);

// quick check that the server is alive
app.get("/", (req, res) => res.send("NexaAI API is running"));

app.use("/api/auth", authRouter);
app.use("/api/payment", paymentRouter);

// free users: daily message limit (runs before the chat routes)
app.use("/api/chat", requireAuth, usageLimit);
app.use("/api", chatRouter);

app.listen(PORT, () => {
    console.log(`server is running ${PORT}`);
    connectDB();
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Conected to the Database!")
    } catch (err) {
        console.log("Failed to connect with Database", err)
    }
}