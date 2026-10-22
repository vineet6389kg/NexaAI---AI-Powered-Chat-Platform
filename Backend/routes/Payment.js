import crypto from "node:crypto";
import express from "express";
import Razorpay from "razorpay";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import requireAuth from "../middleware/auth.js";
import publicUser from "../utils/publicUser.js";

const router = express.Router();
router.use(requireAuth);

const PRICE_INR = Number(process.env.PRO_PRICE_INR) || 199;
const PRO_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const payLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId),
  message: { error: "Too many payment attempts. Please try again later." },
});

const getRazorpay = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
};

// price shown in the upgrade popup (the real price is always decided here, on the server)
router.get("/plan", (req, res) => {
  res.json({ price: PRICE_INR, currency: "INR", days: PRO_DAYS });
});

// 1) create a Razorpay order for the logged-in user
router.post("/order", payLimiter, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: "Demo accounts can't upgrade. Please create a free account." });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ error: "Payments are not configured yet." });
    }

    const order = await razorpay.orders.create({
      amount: PRICE_INR * 100, // Razorpay uses paise
      currency: "INR",
      receipt: `pro_${Date.now()}`,
    });

    await Payment.create({
      user: req.userId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // the key id is public, the secret never leaves the server
    });
  } catch (err) {
    console.log("Razorpay order error:", err?.error || err);
    res.status(500).json({ error: "Could not start the payment. Please try again." });
  }
});

// 2) after paying, the browser sends the three values Razorpay gave it.
//    We recompute the signature with our secret; only a real payment matches.
router.post("/verify", payLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // mark the order paid. Only one request can win this, so Pro is never added twice.
    const claimed = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id, user: req.userId, status: "created" },
      { status: "paid", paymentId: razorpay_payment_id },
    );

    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Account not found" });

    if (claimed) {
      // extend from the current end date if the user is already Pro
      const start = user.isPro() ? user.proUntil : new Date();
      user.plan = "pro";
      user.proUntil = new Date(start.getTime() + PRO_DAYS * DAY_MS);
      await user.save();
    }

    res.json({ user: publicUser(user) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Could not verify the payment" });
  }
});

export default router;