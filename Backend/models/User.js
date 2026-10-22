import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  expiresAt: Date, // only set for guest users
  createdAt: { type: Date, default: Date.now },
});

// guest accounts delete themselves when expiresAt is reached
UserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("User", UserSchema);