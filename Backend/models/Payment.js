import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  orderId: { type: String, required: true, unique: true },
  paymentId: String,
  amount: Number, // in paise (199 rupees = 19900)
  currency: String,
  status: { type: String, enum: ["created", "paid"], default: "created" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", PaymentSchema);