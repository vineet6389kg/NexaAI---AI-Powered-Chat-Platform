import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'node:dns';
import chatRouter from './routes/Chat.js';
import authRouter from './routes/Auth.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.set("trust proxy", 1); // needed for rate limiting behind Render/Vercel/etc.
app.use(express.json({ limit: "5mb" })); // images are sent as base64
app.use(cors());

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
]);

app.use("/api/auth", authRouter);
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