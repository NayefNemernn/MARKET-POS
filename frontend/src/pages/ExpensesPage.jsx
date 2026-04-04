import React, { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { DollarSign, Plus, Trash2, RefreshCw, Search, TrendingDown } from "lucide-react";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";
const CATEGORIES = ["rent", "utilities", "salaries", "supplies", "maintenance", "marketing", "transport", "other"];
const CAT_COLORS = { rent: "bg-blue-100 text-blue-700", utilities: "bg-yellow-100 text-yellow-700", salaries: "bg-purple-100 text-purple-700", supplies: "bg-green-100 text-green-700", maintenance: "bg-orange-100 text-orange-700", marketing: "bg-pink-100 text-pink-700", transport: "bg-cyan-100 text-cyan-700", other: "bg-gray-100 text-gray-700" };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", category: "other", paymentMethod: "cash", notes: "", date: new Date().toISOString().split("T")[0] });
  const [filters, setFilters] = useState({ from: "", to: "", category: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to)   params.to   = filters.to;
      if (filters.category) params.category = filters.category;
      const [e, s] = await Promise.all([api.get("/expenses", { params }), api.get("/expenses/summary", { params })]);
      setExpenses(e.data); setSummary(s.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return toast.error("Title and amount required");
    try {
      await api.post("/expenses", { ...form, amount: +form.amount });
      toast.success("Expense added");
      setShowForm(false);
      setForm({ title: "", amount: "", category: "other", paymentMethod: "cash", notes: "", date: new Date().toISOString().split("T")[0] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try { await api.delete(`/expenses/${id}`); toast.success("Deleted"); load(); } catch { toast.error("Failed"); }
  };

  const filtered = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950 p-5">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center"><TrendingDown size={20} className="text-white"/></div>
            <div><h1 className="text-xl font-bold">Expenses</h1><p className="text-xs text-gray-500">Track all store expenses</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition"><RefreshCw size={13}/></button>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition"><Plus size={14}/> Add Expense</button>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${CARD} p-4 col-span-2 md:col-span-1`}>
              <div className="text-xs text-gray-500 mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600">${summary.totalAmount?.toFixed(2)}</div>
            </div>
            {summary.summary?.slice(0, 3).map(s => (
              <div key={s._id} className={`${CARD} p-4`}>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[s._id] || CAT_COLORS.other}`}>{s._id}</span>
                <div className="text-lg font-bold mt-2">${s.total?.toFixed(2)}</div>
                <div className="text-xs text-gray-400">{s.count} entries</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="border rounded-xl px-3 py-2 text-sm dark:bg-[#141414] dark:border-white/10 dark:text-white" placeholder="From"/>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="border rounded-xl px-3 py-2 text-sm dark:bg-[#141414] dark:border-white/10 dark:text-white" placeholder="To"/>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="border rounded-xl px-3 py-2 text-sm dark:bg-[#141414] dark:border-white/10 dark:text-white">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(filters.from || filters.to || filters.category) && <button onClick={() => setFilters({ from: "", to: "", category: "" })} className="text-xs text-blue-500 hover:underline">Clear filters</button>}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 rounded-xl text-sm border dark:bg-[#141414] dark:border-white/10 dark:text-white outline-none"/>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleCreate} className={`${CARD} p-5 space-y-4`}>
            <h3 className="font-semibold">Add New Expense</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
                <input required placeholder="e.g. Monthly Rent" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none focus:ring-2 focus:ring-red-400"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount ($) *</label>
                <input required type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none focus:ring-2 focus:ring-red-400"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <input placeholder="Optional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition">Save Expense</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition">Cancel</button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className={`${CARD} overflow-hidden`}>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-red-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500">
                <tr>{["Title", "Category", "Amount", "Method", "Date", "Notes", ""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-xs">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filtered.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{e.title}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[e.category] || CAT_COLORS.other}`}>{e.category}</span></td>
                    <td className="px-4 py-3 font-bold text-red-600">${e.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.paymentMethod}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{e.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(e._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No expenses found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}