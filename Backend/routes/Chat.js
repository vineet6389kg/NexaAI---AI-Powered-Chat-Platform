import express from "express";
import Thread from "../models/Thread.js"


const router = express.Router();

//test

router.post("/test", async (req, res) => {
  try {
    const thread = new Thread({
      threadId: "xyz",
      title: "Testing new Thread"
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
    const threads = await Thread.find({}).sort({updatedAt: -1}); // here sort function show thread in Ascending order;
    res.json(threads);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch Thread" });
  }
});

router.get("thread/:threadId", async(req,res)=>{
  const {threadId} = req.params;
  try{
    const thread = await Thread.findOne({threadId});

  }catch{

  }
})


export default router;