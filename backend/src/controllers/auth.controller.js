import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import User from "../models/User.js";

// GET USERS FOR LOGIN PAGE — public, returns only username/role, no sensitive data
// Returns users where active is true OR active field doesn't exist yet (old seeded users)
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

// REGISTER USER — admin only
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

// LOGIN — one device at a time
export const login = async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Allow login if active is true OR if field doesn't exist (old users)
    if (user.active === false) return res.status(403).json({ message: "Account disabled" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // One-device enforcement
    if (user.deviceId && user.deviceId !== deviceId) {
      return res.status(403).json({ message: "This account is already logged in on another device" });
    }

    const sessionToken = uuid();
    user.deviceId = deviceId;
    user.sessionToken = sessionToken;
    user.active = true; // ensure field is set for old users
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, sessionToken },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGOUT — clears device session
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) { user.deviceId = null; user.sessionToken = null; await user.save(); }
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD — admin only
export const changePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ message: "Missing fields" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = newPassword;
    user.deviceId = null;
    user.sessionToken = null;
    await user.save();
    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};