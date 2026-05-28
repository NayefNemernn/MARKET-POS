import { useState, useEffect, useCallback } from "react";
import { X, Search, RefreshCw, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { getSales } from "../../api/sale.api";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";

const METHOD_STYLE = {
  cash:             "bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300",
  card:             "bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300",
  paylater:         "bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-300",
  split:            "bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300",
  bank_transfer:    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  cash_on_delivery: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
};

const STATUS_STYLE = {
  completed:          "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  partially_returned: "bg-amber-100   dark:bg-amber-900/30  text-amber-700   dark:text-amber-300",
  fully_returned:     "bg-red-100     dark:bg-red-900/30    text-red-700     dark:text-red-300",
  pending_payment:    "bg-purple-100  dark:bg-purple-900/30 text-purple-700  dark:text-purple-300",
};

function fmt(d) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " + date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function SaleRow({ sale, formatUSD }) {
  const [open, setOpen] = useState(false);
  const id6 = sale._id.slice(-6).toUpperCase();

  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
      >
        {/* Receipt icon */}
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
          <Receipt size={14} className="text-blue-500" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">#{id6}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${METHOD_STYLE[sale.paymentMethod] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"}`}>
              {sale.paymentMethod?.replace("_", " ")}
            </span>
            {sale.status !== "completed" && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[sale.status] || ""}`}>
                {sale.status?.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-gray-400 tabular-nums">{fmt(sale.createdAt)}</span>
            {sale.customerName && (
              <span className="text-[11px] text-gray-400 truncate">· {sale.customerName}</span>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">
            {formatUSD(sale.total)}
          </span>
          {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded items */}
      {open && (
        <div className="px-4 pb-3 bg-gray-50/60 dark:bg-white/[0.02]">
          <div className="space-y-1 mb-2">
            {sale.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span className="truncate flex-1">{item.name}</span>
                <span className="tabular-nums ml-2">×{item.quantity}</span>
                <span className="tabular-nums ml-3 font-medium">{formatUSD(item.subtotal)}</span>
              </div>
            ))}
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-xs text-red-500">
              <span>Discount</span>
              <span>−{formatUSD(sale.discountAmount)}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>VAT</span>
              <span>+{formatUSD(sale.taxAmount)}</span>
            </div>
          )}
          {sale.totalRefunded > 0 && (
            <div className="flex justify-between text-xs text-amber-500">
              <span>Refunded</span>
              <span>−{formatUSD(sale.totalRefunded)}</span>
            </div>
          )}
          {sale.notes && (
            <p className="text-[11px] text-gray-400 mt-1 italic">{sale.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CashierTransactionHistory({ open, onClose }) {
  const { user } = useAuth();
  const { formatUSD } = useCurrency();

  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [date,    setDate]    = useState("");

  const uid = user?.id || user?._id;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const params = { userId: uid, limit: 200 };
      if (date) { params.from = date; params.to = date; }
      const data = await getSales(params);
      setSales(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [uid, date]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const filtered = sales.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.customerName?.toLowerCase().includes(q) ||
      s._id.slice(-6).toLowerCase() === q ||
      s.items?.some(i => i.name?.toLowerCase().includes(q))
    );
  });

  const todayTotal  = sales
    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString() && s.status !== "fully_returned")
    .reduce((sum, s) => sum + s.total, 0);
  const todayCount  = sales
    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
    .length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-md h-full bg-white dark:bg-[#111] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Receipt size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">My Transactions</h2>
            <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
          </div>
          <button
            onClick={load}
            className={`w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition ${loading ? "animate-spin" : ""}`}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Today summary */}
        {!date && (
          <div className="shrink-0 flex gap-3 px-5 py-3 bg-blue-50/60 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/20">
            <div className="flex-1 text-center">
              <p className="text-[11px] text-gray-400 font-medium">Today's Sales</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatUSD(todayTotal)}</p>
            </div>
            <div className="w-px bg-blue-100 dark:bg-blue-900/30" />
            <div className="flex-1 text-center">
              <p className="text-[11px] text-gray-400 font-medium">Transactions</p>
              <p className="text-base font-bold text-gray-800 dark:text-white tabular-nums">{todayCount}</p>
            </div>
            <div className="w-px bg-blue-100 dark:bg-blue-900/30" />
            <div className="flex-1 text-center">
              <p className="text-[11px] text-gray-400 font-medium">All Loaded</p>
              <p className="text-base font-bold text-gray-800 dark:text-white tabular-nums">{sales.length}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="shrink-0 flex gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-xl px-3 py-2">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer, ID, product…"
              className="flex-1 bg-transparent text-xs outline-none placeholder-gray-400 text-gray-800 dark:text-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs">✕</button>
            )}
          </div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-xs bg-gray-100 dark:bg-white/5 rounded-xl px-3 py-2 outline-none text-gray-700 dark:text-gray-300 border-0 cursor-pointer"
          />
          {date && (
            <button
              onClick={() => setDate("")}
              className="text-xs px-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500 font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sales list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Receipt size={32} className="opacity-20 mb-2" />
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <div>
              {filtered.map(sale => (
                <SaleRow key={sale._id} sale={sale} formatUSD={formatUSD} />
              ))}
            </div>
          )}
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="shrink-0 px-4 py-2.5 border-t border-gray-100 dark:border-white/5 text-center text-[11px] text-gray-400">
            Showing {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
