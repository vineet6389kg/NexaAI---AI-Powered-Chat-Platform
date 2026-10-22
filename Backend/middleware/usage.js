import User from "../models/User.js";

const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT) || 20;

// today's date in India time, e.g. "2026-10-22" (the limit resets at midnight IST)
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// Pro users pass freely. Free users get FREE_DAILY_LIMIT messages per day.
export default async function usageLimit(req, res, next) {
  if (req.method !== "POST") return next();

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Account not found" });
    if (user.isPro()) return next();

    const day = today();
    if (user.usageDate !== day) {
      user.usageDate = day;
      user.usageCount = 0;
    }

    if (user.usageCount >= FREE_DAILY_LIMIT) {
      return res.status(403).json({
        code: "LIMIT_REACHED",
        error: `You've used all ${FREE_DAILY_LIMIT} free messages for today. Upgrade to Pro for unlimited chats.`,
      });
    }

    user.usageCount += 1;
    await user.save();
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}