import React, { useState, useEffect, useRef } from "react";
import { login as loginApi, getLoginUsers } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserShield, FaUser, FaCashRegister } from "react-icons/fa";
import ThemeToggle from "../components/ThemeToggle";

const ROLE_ICONS = { admin: <FaUserShield />, cashier: <FaUser /> };

export default function Login() {
  const { login } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [usernameInput, setUsernameInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // Fetch all users silently on mount (names stay hidden until typed)
  useEffect(() => {
    getLoginUsers()
      .then(setUsers)
      .catch(() => setFetchError("Server unavailable"))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Focus input on load
  useEffect(() => {
    if (!loadingUsers) setTimeout(() => inputRef.current?.focus(), 100);
  }, [loadingUsers]);

  // Keyboard PIN entry when user selected
  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedUser) return;
      if (e.target.tagName === "INPUT") return;
      if (e.key === "Backspace") setPin(p => p.slice(0, -1));
      else if (e.key === "Escape") { setPin(""); setError(""); }
      else if (e.key === "Enter" && pin.length >= 4) submitLogin(pin);
      else if (/^[0-9]$/.test(e.key) && pin.length < 6) setPin(p => p + e.key);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedUser, pin]);

  // Auto-submit at 6 digits
  useEffect(() => {
    if (pin.length === 6) submitLogin(pin);
  }, [pin]);

  const submitLogin = async (currentPin) => {
    if (!selectedUser || loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await loginApi({ username: selectedUser.username, password: currentPin });
      login(data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    setUsernameInput(u.username);
    setPin("");
    setError("");
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setUsernameInput("");
    setPin("");
    setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Only show matching users AFTER at least 1 character is typed
  const showSuggestions = usernameInput.trim().length > 0 && !selectedUser;
  const filteredUsers = showSuggestions
    ? users.filter(u => u.username.toLowerCase().includes(usernameInput.toLowerCase().trim()))
    : [];

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center relative overflow-hidden">
      <ThemeToggle />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative p-8 rounded-3xl w-[420px] bg-[#151515]
          shadow-[0_0_40px_rgba(59,130,246,0.15),15px_15px_40px_#050505,-15px_-15px_40px_#1f1f1f]"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl mb-3
            shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <FaCashRegister />
          </div>
          <h1 className="text-2xl text-white font-bold">Market POS</h1>
          <p className="text-gray-500 text-sm mt-1">
            {selectedUser ? `Enter PIN for ${selectedUser.username}` : "Type your username to continue"}
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Username input ── */}
          {!selectedUser ? (
            <motion.div key="step-username"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

              {/* Input */}
              <div className="relative mb-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter your username..."
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && filteredUsers.length === 1) selectUser(filteredUsers[0]);
                  }}
                  className="w-full px-4 py-3.5 rounded-2xl
                    bg-[#1c1c1c] border border-white/10
                    text-white placeholder-gray-600
                    focus:outline-none focus:border-blue-500/60
                    focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]
                    transition text-sm"
                />
              </div>

              {/* Matching users — only shown when typing */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col gap-2 mt-3 max-h-52 overflow-y-auto"
                  >
                    {loadingUsers ? (
                      <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map(u => (
                        <motion.button
                          key={u._id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => selectUser(u)}
                          className="flex items-center gap-4 px-4 py-3 rounded-2xl
                            bg-[#222] border border-white/5
                            hover:border-blue-500/40
                            hover:shadow-[0_0_12px_rgba(59,130,246,0.1)]
                            transition text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center
                            text-blue-400 text-base flex-shrink-0">
                            {ROLE_ICONS[u.role] || <FaUser />}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{u.username}</p>
                            <p className="text-gray-500 text-xs capitalize">{u.role}</p>
                          </div>
                          <span className="ml-auto text-gray-600 text-sm">→</span>
                        </motion.button>
                      ))
                    ) : (
                      <p className="text-gray-600 text-center text-sm py-3">No matching users</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hint when nothing typed yet */}
              {!showSuggestions && !loadingUsers && !fetchError && (
                <p className="text-center text-gray-700 text-xs mt-4">
                  Start typing to find your account
                </p>
              )}

              {fetchError && (
                <p className="text-center text-red-500 text-xs mt-4">{fetchError}</p>
              )}
            </motion.div>

          ) : (
            /* ── STEP 2: PIN pad ── */
            <motion.div key="step-pin"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* Selected user chip */}
              <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-2xl bg-[#1c1c1c]">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm">
                  {ROLE_ICONS[selectedUser.role] || <FaUser />}
                </div>
                <span className="text-white font-medium text-sm flex-1">{selectedUser.username}</span>
                <button onClick={clearSelection}
                  className="text-gray-500 hover:text-gray-300 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                  ← Change
                </button>
              </div>

              {/* PIN dots */}
              <div className="flex justify-center gap-3 mb-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div key={i}
                    animate={{ scale: pin.length > i ? 1.25 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`w-3 h-3 rounded-full transition-colors duration-150 ${
                      pin.length > i
                        ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>

              <p className="text-center text-gray-600 text-xs mb-3">
                Tap or use keyboard numbers · Enter to confirm
              </p>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-red-400 text-center text-sm mb-3">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2.5">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <motion.button key={n}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 12px rgba(59,130,246,0.25)" }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { if (pin.length < 6) setPin(p => p + String(n)); }}
                    disabled={loading}
                    className="py-4 rounded-2xl text-xl font-semibold text-white
                      bg-[#1c1c1c] border border-white/5
                      hover:border-blue-500/30 transition-all disabled:opacity-40">
                    {n}
                  </motion.button>
                ))}
                <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => { setPin(""); setError(""); }}
                  className="py-4 rounded-2xl text-red-400 font-bold text-sm
                    bg-[#1c1c1c] border border-white/5 hover:border-red-500/30 transition-all">
                  C
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                  onClick={() => { if (pin.length < 6) setPin(p => p + "0"); }}
                  disabled={loading}
                  className="py-4 rounded-2xl text-xl font-semibold text-white
                    bg-[#1c1c1c] border border-white/5
                    hover:border-blue-500/30 transition-all disabled:opacity-40">
                  0
                </motion.button>
                <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => setPin(p => p.slice(0, -1))}
                  className="py-4 rounded-2xl text-white text-lg
                    bg-[#1c1c1c] border border-white/5 hover:border-white/20 transition-all">
                  ⌫
                </motion.button>
              </div>

              {loading && (
                <div className="flex justify-center mt-4">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-gray-700 mt-6">
          Done by <span className="text-blue-500">Abbas El Nemer</span>
        </p>
      </motion.div>
    </div>
  );
}