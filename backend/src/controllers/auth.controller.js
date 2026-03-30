import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      $or: [{ active: true }, { active: { $exists: false } }]
    }).select("username role _id");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    const user = await User.create({ username, password, role });
    res.status(201).json({ message: "User created", user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password, deviceId, deviceName, deviceOS, deviceBrowser } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.active === false) return res.status(403).json({ message: "Account disabled" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const maxDevices = user.maxDevices || 1;

    // Check if this device is already logged in
    const existingDeviceIdx = user.devices.findIndex(d => d.deviceId === deviceId);

    if (existingDeviceIdx === -1) {
      // New device — check if we have room
      if (user.devices.length >= maxDevices) {
        return res.status(403).json({
          message: `This account is limited to ${maxDevices} device${maxDevices > 1 ? "s" : ""}. All slots are taken. Ask admin to free a slot.`,
          devicesUsed: user.devices.length,
          maxDevices,
        });
      }
    }

    const sessionToken = uuid();
    const now          = new Date();
    const ip           = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || null;

    const deviceEntry = {
      deviceId,
      deviceName:    deviceName    || "Unknown Device",
      deviceOS:      deviceOS      || "Unknown OS",
      deviceBrowser: deviceBrowser || "Unknown Browser",
      lastLoginAt:   now,
      lastLoginIP:   ip,
      sessionToken,
    };

    if (existingDeviceIdx !== -1) {
      // Update existing device entry
      user.devices[existingDeviceIdx] = deviceEntry;
    } else {
      // Add new device
      user.devices.push(deviceEntry);
    }

    // Keep legacy fields updated (first device)
    user.deviceId      = deviceId;
    user.deviceName    = deviceEntry.deviceName;
    user.deviceOS      = deviceEntry.deviceOS;
    user.deviceBrowser = deviceEntry.deviceBrowser;
    user.lastLoginAt   = now;
    user.lastLoginIP   = ip;
    user.sessionToken  = sessionToken;
    user.active        = true;

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, sessionToken, deviceId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id:        user._id,
        username:  user.username,
        role:      user.role,
        storeName: user.storeName || "Market POS",
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      const deviceId = req.user.deviceId;
      // Remove this device from the devices array
      user.devices = user.devices.filter(d => d.deviceId !== deviceId);
      // If no devices left, clear legacy fields too
      if (user.devices.length === 0) {
        user.deviceId     = null;
        user.sessionToken = null;
      }
      await user.save();
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ message: "Missing fields" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password     = newPassword;
    user.devices      = [];
    user.deviceId     = null;
    user.sessionToken = null;
    await user.save();
    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};