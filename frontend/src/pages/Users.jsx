import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RequireAdmin from "../components/RequireAdmin";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "cashier"
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      setForm({ username: "", password: "", role: "cashier" });
      setShowForm(false);
      fetchUsers();
    } catch {
      alert("Failed to create user");
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user._id}`, {
        active: !user.active
      });
      fetchUsers();
    } catch {
      alert("Failed to update user");
    }
  };

  if (loading) {
    return <div className="p-6">Loading users…</div>;
  }

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                👤 Staff Management
              </h1>
              <p className="text-gray-500 text-sm">
                Manage cashiers and administrators
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
            >
              + Add User
            </button>
          </div>

          {/* CREATE USER FORM */}
          {showForm && (
            <form
              onSubmit={handleCreate}
              className="bg-white rounded-lg shadow p-6 mb-6 grid md:grid-cols-4 gap-4"
            >
              <input
                placeholder="Username"
                className="border rounded px-3 py-2"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="border rounded px-3 py-2"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />

              <select
                className="border rounded px-3 py-2"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
              </select>

              <button className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700">
                Create
              </button>
            </form>
          )}

          {/* USERS TABLE */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">Username</th>
                  <th className="p-4 text-center">Role</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4">{user.username}</td>

                    <td className="p-4 text-center capitalize">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          user.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.active ? "Active" : "Disabled"}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleStatus(user)}
                        className={`px-4 py-1 rounded text-white ${
                          user.active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {user.active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-6 text-center text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}
