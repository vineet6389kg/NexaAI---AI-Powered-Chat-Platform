import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  expiresAt: Date, // only set for guest users

  // subscription
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  proUntil: Date,

  // free-plan daily message counter
  usageDate: { type: String, default: "" }, // e.g. "2026-10-22"
  usageCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

// guest accounts delete themselves when expiresAt is reached
UserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// true while the paid period has not ended
UserSchema.methods.isPro = function () {
  return this.plan === "pro" && !!this.proUntil && this.proUntil > new Date();
};

export default mongoose.model("User", UserSchema);