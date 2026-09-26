import express from "express";
import Thread from "../models/Thread.js";

const router = express.Router();

//test

router.post("/test", async (req, res) => {
  try {
    const thread = new Thread({
      threadId: "xyz",
      title: "Testing new Thread",
    });
    const response = await thread.save();
    res.send(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failded to save in DB" });
  }
});

// Get all thread

router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({}).sort({ updatedAt: -1 }); // here sort function show thread in Ascending order;
    res.json(threads);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch Thread" });
  }
});

router.get("thread/:threadId", async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await Thread.findOne({ threadId });
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread.messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch Chat" });
  }
});

router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params; // fetching thread Id
  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId });
    if (!deletedThread) {
      res.status(404)({ error: "Thread Not Found" });
    }
    res.status(200).json({ success: "Thread Deleted Successfully" });
  } catch (err) {
    console.log(err);
  }
});

router.post("/chat", async(req,res)=>{
  try{

  }catch(err){
    console.log(err);

  }
})

export default router;
