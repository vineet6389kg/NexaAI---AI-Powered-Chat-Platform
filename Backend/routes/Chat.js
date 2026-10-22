import express from "express";
import Thread from "../models/Thread.js";
import getGeminiResponse from "../utils/Gemini.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

// every chat route needs a logged-in user
router.use(requireAuth);

// Get all threads of the logged-in user
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({ user: req.userId }).sort({
      updatedAt: -1,
    });
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
    const deletedThread = await Thread.findOneAndDelete({
      threadId,
      user: req.userId,
    });
    if (!deletedThread)
      return res.status(404).json({ error: "Thread Not Found" });
    res.status(200).json({ success: "Thread Deleted Successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete Thread" });
  }
});

router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "missing required field" });
  }

  try {
    let thread = await Thread.findOne({ threadId, user: req.userId });

    if (!thread) {
      thread = new Thread({
        user: req.userId,
        threadId,
        title: message,
        messages: [{ role: "user", content: message }],
      });
    } else {
      thread.messages.push({ role: "user", content: message });
    }

    // MEMORY: take the last 10 messages (this already includes the new question)
    const history = thread.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Gemini needs the conversation to start with a user message
    while (history.length > 1 && history[0].role !== "user") history.shift();

    const assistantReply = await getGeminiResponse(history);

    if (!assistantReply) {
      return res
        .status(500)
        .json({ error: "Gemini failed to generate a response" });
    }

    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();

    await thread.save();
    res.json({ reply: assistantReply });
  } catch (err) {
    console.log(err);
    if (err.status === 503 || err.status === 429) {
      return res.status(503).json({
        error: "The AI is busy right now. Please try again in a few seconds.",
      });
    }
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;
