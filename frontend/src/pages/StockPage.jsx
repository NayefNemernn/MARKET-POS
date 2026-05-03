import React, { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Package, TrendingUp, TrendingDown, Search, RefreshCw, Plus, Minus, AlertTriangle } from "lucide-react";
import { useStockTranslation } from "../hooks/useStockTranslation";
import { cacheByKey, getCachedByKey, queueMutation, cacheProducts, getCachedProducts } from "../lib/offlineDB";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";

export default function StockPage() {
  const t = useStockTranslation();
  const [products, setProducts] = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [tab,      setTab]      = useState("products");
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm,  setAdjustForm]  = useState({ change: "", reason: "", type: "manual_add" });

  const load = async () => {
    setLoading(true);
    // Show cached data immediately
    const cachedP = await getCachedByKey("stock_products_list");
    const cachedL = await getCachedByKey("stock_logs_list");
    if (cachedP) setProducts(cachedP);
    if (cachedL) setLogs(cachedL);

    try {
      const [p, l] = await Promise.all([api.get("/products"), api.get("/stock/logs")]);
      setProducts(p.data);
      setLogs(l.data);
      await cacheByKey("stock_products_list", p.data);
      await cacheByKey("stock_logs_list", l.data);
    } catch {
      if (!cachedP) toast.error(t.failed);
      else toast("📦 Showing cached data", { icon: "💾" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdjust = async () => {
    if (!adjustForm.change || adjustForm.change === "0") return toast.error(t.enterQuantity);

    if (!navigator.onLine) {
      const payload = { productId: adjustModal._id, change: +adjustForm.change, reason: adjustForm.reason, type: adjustForm.type };
      await queueMutation("stock_adjust", "/api/stock/adjust", "POST", payload);
      // Update local state + caches
      const change = +adjustForm.change;
      const updated = products.map(p => p._id === adjustModal._id ? { ...p, stock: Math.max(0, p.stock + change) } : p);
      setProducts(updated);
      await cacheByKey("stock_products_list", updated);
      await cacheProducts(updated); // also update POS products cache
      toast.success("📴 Stock adjustment queued — will sync when connected");
      setAdjustModal(null);
      setAdjustForm({ change: "", reason: "", type: "manual_add" });
      return;
    }

    try {
      await api.post("/stock/adjust", { productId: adjustModal._id, change: +adjustForm.change, reason: adjustForm.reason, type: adjustForm.type });
      toast.success(t.stockAdjusted);
      setAdjustModal(null);
      setAdjustForm({ change: "", reason: "", type: "manual_add" });
      load();
    } catch (err) { toast.error(err.response?.data?.message || t.failed); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const lowStock  = products.filter(p => p.stock <= 5 && p.stock > 0);
  const outStock  = products.filter(p => p.stock === 0);
  const expiring  = products.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 7 * 86400000));

  if (loading && !products.length) return <div className="flex items-center justify-center h-64 text-gray-500">{t.loading}</div>;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950 p-5">
      <div className="w-full space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Package size={20} className="text-white"/></div>
            <div><h1 className="text-xl font-bold">{t.title}</h1><p className="text-xs text-gray-500">{t.subtitle}</p></div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 hover:bg-gray-50 shadow-[0_4px_0_0_rgba(0,0,0,0.12)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-[4px] transition-[transform,box-shadow] duration-75 select-none">
            <RefreshCw size={13}/> {t.refresh}
          </button>
        </div>

        {/* Alert cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t.outOfStock,   value: outStock.length,  color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/20",    icon: "🚨" },
            { label: t.lowStock,     value: lowStock.length,  color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20",icon: "⚠️" },
            { label: t.expiringSoon, value: expiring.length,  color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20",icon: "📅" },
          ].map(c => (
            <div key={c.label} className={`${CARD} ${c.bg} p-4`}>
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-500">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/10 w-fit">
          {[["products", t.tabProducts], ["logs", t.tabLog]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input placeholder={t.searchProducts} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 focus:border-blue-400"/>
            </div>

            <div className={`${CARD} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500">
                  <tr>{[t.colProduct, t.colBarcode, t.colCategory, t.colStock, t.colCost, t.colPrice, t.colExpiry, t.colActions].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-xs">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filtered.map(p => {
                    const isLow     = p.stock <= 5 && p.stock > 0;
                    const isOut     = p.stock === 0;
                    const isExpiring = p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 7 * 86400000);
                    return (
                      <tr key={p._id} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition ${isOut ? "bg-red-50/30 dark:bg-red-900/10" : isLow ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 dark:text-white">{p.name}</div>
                          {isExpiring && <div className="text-xs text-orange-500">⚠ {t.expiringSoonBadge}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{p.barcode}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.category?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold text-sm ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-800 dark:text-white"}`}>
                            {isOut ? t.outBadge : p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">${p.cost?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs font-medium">${p.price?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setAdjustModal(p); setAdjustForm({ change: "", reason: "", type: "manual_add" }); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition">
                            <Plus size={11}/> {t.adjustBtn}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{t.noProductsFound}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className={`${CARD} overflow-hidden`}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500">
                <tr>{[t.colProduct, t.colType, t.colChange, t.colBefore, t.colAfter, t.colReason, t.colBy, t.colDate].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-xs">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-sm">{log.productName}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{log.type}</span></td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm flex items-center gap-1 ${log.change > 0 ? "text-green-600" : "text-red-600"}`}>
                        {log.change > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {log.change > 0 ? "+" : ""}{log.change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.quantityBefore}</td>
                    <td className="px-4 py-3 text-xs font-medium">{log.quantityAfter}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{log.reason || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.userId?.username || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{t.noStockLogs}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setAdjustModal(null); }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold mb-1">{t.adjustStock}</h2>
            <p className="text-sm text-gray-500 mb-4">{adjustModal.name} — {t.current} <strong>{adjustModal.stock}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.typeLabel}</label>
                <select value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none">
                  <option value="manual_add">{t.addStock}</option>
                  <option value="manual_remove">{t.removeStock}</option>
                  <option value="adjustment">{t.adjustment}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.quantityLabel}</label>
                <input type="number" placeholder={adjustForm.type === "manual_remove" ? "-10" : "10"} value={adjustForm.change}
                  onChange={e => setAdjustForm(f => ({ ...f, change: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
                <p className="text-xs text-gray-400 mt-1">{t.negativeHint}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t.reasonLabel}</label>
                <input type="text" placeholder="e.g. Received delivery, damaged goods..." value={adjustForm.reason}
                  onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdjust} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-[4px] transition-[transform,box-shadow] duration-75 select-none">{t.apply}</button>
                <button onClick={() => setAdjustModal(null)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm shadow-[0_4px_0_0_rgba(0,0,0,0.12)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-[4px] transition-[transform,box-shadow] duration-75 select-none">{t.cancel}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
