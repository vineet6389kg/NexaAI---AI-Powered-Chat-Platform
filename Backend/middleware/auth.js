import jwt from "jsonwebtoken";

// Protects routes: expects header  Authorization: Bearer <token>
export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in to continue" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.isGuest = !!payload.guest;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again" });
  }
}