import React, { useState } from "react";
import { login as loginApi } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginApi({ username, password });
      login(data);
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-sm"
      >
        {/* LOGO / TITLE */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-extrabold tracking-tight">
            Market POS
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Sign in to continue
          </p>
        </motion.div>

        {/* USERNAME */}
        <div className="relative mb-5">
          <input
            className="peer w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
            placeholder=" "
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 bg-white px-1">
            Username
          </label>
        </div>

        {/* PASSWORD */}
        <div className="relative mb-6">
          <input
            type="password"
            className="peer w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-600"
            placeholder=" "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="absolute left-4 top-3 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 bg-white px-1">
            Password
          </label>
        </div>

        {/* ERROR */}
        {error && (
          <motion.p
            initial={{ x: -5 }}
            animate={{ x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.4 }}
            className="text-red-600 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* BUTTON */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition"
        >
          Login
        </motion.button>

        {/* FOOTER */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Secure POS System © {new Date().getFullYear()}
        </p>
      </motion.form>
    </div>
  );
}
