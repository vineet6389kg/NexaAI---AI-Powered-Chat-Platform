import express from "express";
import Thread from "../models/Thread.js";
import getGeminiResponse, { streamGeminiResponse } from "../utils/Gemini.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// every chat route needs a logged-in user
router.use(requireAuth);

// last 10 messages, starting with a user message (Gemini requires that)
const buildHistory = (thread) => {
  const history = thread.messages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  while (history.length > 1 && history[0].role !== "user") history.shift();
  return history;
};

// find the user's thread, or start a new one, and add the new question
const addUserMessage = async (userId, threadId, message) => {
  let thread = await Thread.findOne({ threadId, user: userId });
  if (!thread) {
    thread = new Thread({
      user: userId,
      threadId,
      title: message,
      messages: [{ role: "user", content: message }],
    });
  } else {
    thread.messages.push({ role: "user", content: message });
  }
  return thread;
};

const friendlyError = (err) =>
  err.status === 503 || err.status === 429
    ? "The AI is busy right now. Please try again in a few seconds."
    : "Something went wrong. Please try again.";

// Get all threads of the logged-in user
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({ user: req.userId }).sort({ updatedAt: -1 });
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

// Normal reply (whole answer at once)
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;
  if (!threadId || !message) {
    return res.status(400).json({ error: "missing required field" });
  }

  try {
    const thread = await addUserMessage(req.userId, threadId, message);
    const assistantReply = await getGeminiResponse(buildHistory(thread));

    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();
    await thread.save();

    res.json({ reply: assistantReply });
  } catch (err) {
    console.log(err);
    res.status(err.status === 503 || err.status === 429 ? 503 : 500).json({
      error: friendlyError(err),
    });
  }
});

// Streaming reply (Server-Sent Events)
router.post("/chat/stream", async (req, res) => {
  const { threadId, message } = req.body;
  if (!threadId || !message) {
    return res.status(400).json({ error: "missing required field" });
  }

  // if the user presses Stop or closes the tab, cancel the Gemini request
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();
  });

  try {
    const thread = await addUserMessage(req.userId, threadId, message);

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