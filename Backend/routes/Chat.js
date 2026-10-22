import express from "express";
import rateLimit from "express-rate-limit";
import Thread from "../models/Thread.js";
import { streamGeminiResponse } from "../utils/Gemini.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// every chat route needs a logged-in user
router.use(requireAuth);

// max 20 messages per minute per user (protects your Gemini quota)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: "You are sending messages too fast. Please wait a moment." },
});

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp"];

// returns null (no image), false (invalid image) or a clean { mimeType, data }
const cleanImage = (img) => {
  if (!img || !img.data) return null;
  if (
    !ALLOWED_IMAGES.includes(img.mimeType) ||
    typeof img.data !== "string" ||
    img.data.length > 3_000_000
  ) {
    return false;
  }
  return { mimeType: img.mimeType, data: img.data };
};

// last 10 messages. Only the most recent image is sent, to keep requests fast.
const buildHistory = (thread) => {
  const msgs = thread.messages.slice(-10);
  const lastImageIdx = msgs.map((m) => !!m.image?.data).lastIndexOf(true);

  const history = msgs.map((m, i) => ({
    role: m.role,
    content: m.content,
    image:
      i === lastImageIdx
        ? { mimeType: m.image.mimeType, data: m.image.data }
        : undefined,
  }));

  // Gemini needs the conversation to start with a user message
  while (history.length > 1 && history[0].role !== "user") history.shift();
  return history;
};

const friendlyError = (err) =>
  err.status === 503 || err.status === 429
    ? "The AI is busy right now. Please try again in a few seconds."
    : "Something went wrong. Please try again.";

// ---------- threads ----------

// sidebar list: only the fields it needs (much faster than loading every message)
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({ user: req.userId })
      .select("threadId title updatedAt")
      .sort({ updatedAt: -1 });
    res.json(threads);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch Thread" });
  }
});

router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await Thread.findOne({ threadId, user: req.userId });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread.messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch Chat" });
  }
});

router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId, user: req.userId });
    if (!deletedThread) return res.status(404).json({ error: "Thread Not Found" });
    res.status(200).json({ success: "Thread Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete Thread" });
  }
});

// ---------- chat (streaming) ----------

router.post("/chat/stream", chatLimiter, async (req, res) => {
  const { threadId, message, regenerate } = req.body;

  if (!threadId || (!regenerate && !message)) {
    return res.status(400).json({ error: "missing required field" });
  }

  // if the user presses Stop or closes the tab, cancel the Gemini request
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();
  });

  try {
    let thread;

    if (regenerate) {
      // remove the last answer and ask the same question again
      thread = await Thread.findOne({ threadId, user: req.userId });
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      if (thread.messages.at(-1)?.role === "assistant") thread.messages.pop();
      if (thread.messages.at(-1)?.role !== "user") {
        return res.status(400).json({ error: "Nothing to regenerate" });
      }
    } else {
      const image = cleanImage(req.body.image);
      if (image === false) {
        return res.status(400).json({ error: "That image is not supported or is too large" });
      }

      thread = await Thread.findOne({ threadId, user: req.userId });
      const newMessage = { role: "user", content: message, ...(image ? { image } : {}) };

      if (!thread) {
        thread = new Thread({
          user: req.userId,
          threadId,
          title: message.slice(0, 80),
          messages: [newMessage],
          // guest chats delete themselves after 24 hours
          ...(req.isGuest ? { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } : {}),
        });
      } else {
        thread.messages.push(newMessage);
      }
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let full = "";
    try {
      full = await streamGeminiResponse(
        buildHistory(thread),
        (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
        controller.signal,
      );
    } catch (err) {
      if (err.name !== "AbortError") throw err;
    }

    // save the answer (a partial one too, if the user pressed Stop)
    if (full) {
      thread.messages.push({ role: "assistant", content: full });
      thread.updatedAt = new Date();
      await thread.save();
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.log(err);
    const msg = friendlyError(err);

    if (!res.headersSent) {
      res.status(err.status === 503 || err.status === 429 ? 503 : 500).json({ error: msg });
    } else {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    }
  }
});

export default router;