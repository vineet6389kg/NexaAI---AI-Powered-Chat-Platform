import crypto from "node:crypto";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import publicUser from "../utils/publicUser.js";

const router = express.Router();

const GUEST_LIFETIME_MS = 24 * 60 * 60 * 1000; // guests live for 24 hours

// 10 login/signup tries per 15 minutes per IP (stops password guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

// 5 demo accounts per hour per IP
const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many demo sessions from this network. Please try again later." },
});

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const makeToken = (user) =>
  jwt.sign({ id: user._id, guest: user.isGuest }, process.env.JWT_SECRET, {
    expiresIn: user.isGuest ? "1d" : "7d",
  });

router.post("/signup", authLimiter, async (req, res) => {
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

router.post("/login", authLimiter, async (req, res) => {
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

// Demo login: every click makes a fresh private guest account (deleted after 24h)
router.post("/guest", guestLimiter, async (req, res) => {
  try {
    const id = crypto.randomBytes(6).toString("hex");
    const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
    const user = await User.create({
      name: "Guest",
      email: `guest-${id}@guest.nexaai.local`,
      passwordHash,
      isGuest: true,
      expiresAt: new Date(Date.now() + GUEST_LIFETIME_MS),
    });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Could not start demo" });
  }
});

// used by the frontend on page refresh to restore the session
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "Account not found" });
  res.json({ user: publicUser(user) });
});

export default router;