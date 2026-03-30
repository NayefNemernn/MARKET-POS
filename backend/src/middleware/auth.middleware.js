import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user)        return res.status(401).json({ message: "User not found" });
    if (!user.active) return res.status(403).json({ message: "Account disabled" });

    // Multi-device: validate session token per device
    const deviceId = decoded.deviceId;
    if (deviceId) {
      // New multi-device logic — check the devices array
      const device = user.devices.find(d => d.deviceId === deviceId);
      if (!device || device.sessionToken !== decoded.sessionToken) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
    } else {
      // Legacy single-device logic
      if (user.sessionToken !== decoded.sessionToken) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token invalid" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};