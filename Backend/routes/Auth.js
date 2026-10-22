import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const makeToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

router.post("/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2) return res.status(400).json({ error: "Please enter your name" });
    if (!emailOk(email)) return res.status(400).json({ error: "Enter a valid email address" });
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    // same message for both cases so attackers can't tell which emails exist
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: "Incorrect email or password" });

    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Could not log in" });
  }
});

// used by the frontend on page refresh to restore the session
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "Account not found" });
  res.json({ user: publicUser(user) });
});

export default router;