import React, { useEffect, useState } from "react";
import { getActiveShift, getShifts, openShift, closeShift } from "../api/shift.api";
import api from "../api/axios";
import { useCurrency } from "../context/CurrencyContext";
import toast from "react-hot-toast";
import {
  Clock, DollarSign, TrendingUp, X, CheckCircle2,
  AlertTriangle, BarChart3, CreditCard, RotateCcw, Plus,
  Minus, ArrowUpCircle, ArrowDownCircle
} from "lucide-react";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";

// LBP denominations
const DENOMS = [
  { value: 500000, label: "500k" },
  { value: 100000, label: "100k" },
  { value: 50000,  label: "50k"  },
  { value: 20000,  label: "20k"  },
  { value: 10000,  label: "10k"  },
  { value: 5000,   label: "5k"   },
  { value: 1000,   label: "1k"   },
];

function DenominationCounter({ value, onChange, label = "Denominations (LBP)" }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {DENOMS.map(d => {
        const count = value.find(x => x.value === d.value)?.count || 0;
        const update = (newCount) => {
          const updated = value.filter(x => x.value !== d.value);
          if (newCount > 0) updated.push({ value: d.value, label: d.label, count: newCount, subtotal: newCount * d.value });
          onChange(updated);
        };
        return (
          <div key={d.value} className="flex items-center gap-3">
            <span className="text-xs font-mono w-12 text-gray-500">{d.label}</span>
            <button onClick={() => update(Math.max(0, count - 1))} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition"><Minus size={10}/></button>
            <span className="w-8 text-center text-sm font-bold">{count}</span>
            <button onClick={() => update(count + 1)} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 transition"><Plus size={10}/></button>
            <span className="text-xs text-gray-500 ml-2">{count > 0 ? `= ${(count * d.value).toLocaleString()} ل.ل` : ""}</span>
          </div>
        );
      })}
      <div className="pt-2 border-t dark:border-white/10">
        <p className="text-sm font-bold text-gray-800 dark:text-white">
          Total: {value.reduce((s, d) => s + d.subtotal, 0).toLocaleString()} ل.ل
          <span className="text-gray-500 font-normal ml-2 text-xs">
            ≈ ${(value.reduce((s, d) => s + d.subtotal, 0) / 90000).toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
}

function ZReport({ shift, onClose }) {
  const { formatUSD } = useCurrency();
  const fmtTime = d => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const printReport = () => {
    const win = window.open("", "_blank", "width=360,height=800");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Z-Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;color:#111;width:80mm;padding:6mm 3mm}
.c{text-align:center}.b{font-weight:900}hr{border:none;border-top:1px dashed #aaa;margin:6px 0}
.row{display:flex;justify-content:space-between;padding:2px 0}.warn{color:#b45309;font-weight:700}.ok{color:#15803d;font-weight:700}
@media print{@page{size:80mm auto;margin:0}body{padding:4mm 2mm}}</style></head><body>
<div class="c"><p class="b" style="font-size:18px">Z-REPORT</p>
<p>${fmtTime(shift.openedAt)} → ${fmtTime(shift.closedAt)}</p>
<p>Cashier: ${shift.username || shift.userId}</p></div>
<hr/>
<div class="row"><span>Total Orders</span><span>${shift.totalOrders}</span></div>
<div class="row"><span>Gross Revenue</span><span>$${shift.totalSales?.toFixed(2)}</span></div>
<div class="row"><span>Discounts</span><span>-$${(shift.totalDiscount||0).toFixed(2)}</span></div>
<div class="row"><span>Refunds</span><span>-$${shift.totalRefunds?.toFixed(2)}</span></div>
<div class="row b"><span>Net Revenue</span><span>$${shift.netRevenue?.toFixed(2)}</span></div>
<hr/>
<div class="row"><span>Cash Sales</span><span>$${shift.cashSales?.toFixed(2)}</span></div>
<div class="row"><span>Card Sales</span><span>$${shift.cardSales?.toFixed(2)}</span></div>
<div class="row"><span>Pay Later</span><span>$${shift.payLaterSales?.toFixed(2)}</span></div>
<hr/>
<div class="row"><span>Opening Float</span><span>$${shift.openingFloat?.toFixed(2)}</span></div>
${shift.paidIn > 0 ? `<div class="row ok"><span>Paid In</span><span>+$${shift.paidIn?.toFixed(2)}</span></div>` : ""}
${shift.paidOut > 0 ? `<div class="row warn"><span>Paid Out</span><span>-$${shift.paidOut?.toFixed(2)}</span></div>` : ""}
<div class="row"><span>Expected Cash</span><span>$${shift.expectedCash?.toFixed(2)}</span></div>
${shift.closingCount != null ? `<div class="row"><span>Counted Cash</span><span>$${shift.closingCount?.toFixed(2)}</span></div>
<div class="row ${shift.variance < 0 ? 'warn' : shift.variance > 0 ? 'ok' : ''}"><span>Variance</span><span>${shift.variance >= 0 ? '+' : ''}$${shift.variance?.toFixed(2)}</span></div>` : ""}
${shift.notes ? `<hr/><p style="font-size:11px;color:#666">Notes: ${shift.notes}</p>` : ""}
<hr/>
<p style="text-align:center;font-size:10px;color:#999;margin-top:8px">End of Shift Report</p>
<script>window.onload=()=>{window.print();window.close();}<\/script>
</body></html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-indigo-600 px-6 py-5 text-center">
          <BarChart3 size={32} className="text-white mx-auto mb-2" strokeWidth={1.5}/>
          <h2 className="text-white text-xl font-bold">Z-Report</h2>
          <p className="text-indigo-200 text-sm mt-1">{new Date(shift.openedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · {shift.username}</p>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Net Revenue", value: formatUSD(shift.netRevenue || 0), color: "text-green-600 dark:text-green-400" },
              { label: "Total Orders", value: shift.totalOrders || 0, color: "text-blue-600 dark:text-blue-400" },
              { label: "Refunds", value: formatUSD(shift.totalRefunds || 0), color: "text-red-600 dark:text-red-400" },
              { label: "Discounts", value: formatUSD(shift.totalDiscount || 0), color: "text-orange-600 dark:text-orange-400" },
            ].map(k => (
              <div key={k.label} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          <div className={`${CARD} p-4 space-y-2`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Payment Breakdown</p>
            {[
              { label: "Cash",      value: shift.cashSales || 0,     color: "text-green-600" },
              { label: "Card",      value: shift.cardSales || 0,     color: "text-blue-600"  },
              { label: "Pay Later", value: shift.payLaterSales || 0, color: "text-red-600"   },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">{r.label}</span>
                <span className={`font-bold ${r.color}`}>{formatUSD(r.value)}</span>
              </div>
            ))}
          </div>

          <div className={`${CARD} p-4 space-y-2`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Cash Drawer</p>
            <div className="flex justify-between"><span className="text-sm text-gray-600 dark:text-gray-300">Opening Float</span><span className="font-bold">{formatUSD(shift.openingFloat || 0)}</span></div>
            {shift.paidIn > 0 && <div className="flex justify-between"><span className="text-sm text-green-600">Paid In</span><span className="font-bold text-green-600">+{formatUSD(shift.paidIn)}</span></div>}
            {shift.paidOut > 0 && <div className="flex justify-between"><span className="text-sm text-orange-600">Paid Out</span><span className="font-bold text-orange-600">-{formatUSD(shift.paidOut)}</span></div>}
            <div className="flex justify-between"><span className="text-sm text-gray-600 dark:text-gray-300">Expected Cash</span><span className="font-bold">{formatUSD(shift.expectedCash || 0)}</span></div>
            {shift.closingCount != null && (
              <>
                <div className="flex justify-between"><span className="text-sm text-gray-600 dark:text-gray-300">Counted Cash</span><span className="font-bold">{formatUSD(shift.closingCount)}</span></div>
                <div className={`flex justify-between font-bold ${shift.variance < 0 ? "text-red-500" : shift.variance > 0 ? "text-green-600" : "text-gray-600"}`}>
                  <span>Variance</span><span>{shift.variance >= 0 ? "+" : ""}{formatUSD(shift.variance)}</span>
                </div>
              </>
            )}
          </div>

          {shift.notes && <div className={`${CARD} p-4`}><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Notes</p><p className="text-sm">{shift.notes}</p></div>}
        </div>
        <div className="p-5 border-t dark:border-white/10 flex gap-3">
          <button onClick={printReport} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition">🖨 Print Z-Report</button>
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function ShiftPanel() {
  const { formatUSD } = useCurrency();
  const [activeShift, setActiveShift] = useState(null);
  const [shifts,      setShifts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [zReport,     setZReport]     = useState(null);
  const [openFloat,   setOpenFloat]   = useState("");
  const [openDenoms,  setOpenDenoms]  = useState([]);
  const [useDenomsOpen, setUseDenomsOpen] = useState(false);
  const [closeDenoms, setCloseDenoms] = useState([]);
  const [useDenomsClose, setUseDenomsClose] = useState(false);
  const [closeCount,  setCloseCount]  = useState("");
  const [closeNotes,  setCloseNotes]  = useState("");
  const [showClose,   setShowClose]   = useState(false);
  const [cashEventModal, setCashEventModal] = useState(false);
  const [cashEvent, setCashEvent] = useState({ type: "paid_in", amount: "", reason: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([getActiveShift(), getShifts()]);
      setActiveShift(a); setShifts(s);
    } catch { toast.error("Failed to load shifts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async () => {
    const float = useDenomsOpen
      ? openDenoms.reduce((s, d) => s + d.subtotal, 0) / 90000
      : parseFloat(openFloat) || 0;
    try {
      await openShift({ openingFloat: float, openingDenominations: useDenomsOpen ? openDenoms : [] });
      toast.success("Shift opened");
      setOpenFloat(""); setOpenDenoms([]); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleClose = async () => {
    if (!activeShift) return;
    const count = useDenomsClose
      ? closeDenoms.reduce((s, d) => s + d.subtotal, 0) / 90000
      : closeCount !== "" ? parseFloat(closeCount) : null;
    try {
      const closed = await closeShift(activeShift._id, { closingCount: count, closingDenominations: useDenomsClose ? closeDenoms : [], notes: closeNotes });
      toast.success("Shift closed");
      setShowClose(false); setCloseCount(""); setCloseDenoms([]); setCloseNotes("");
      setZReport(closed); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleCashEvent = async () => {
    if (!cashEvent.amount || +cashEvent.amount <= 0) return toast.error("Enter a valid amount");
    try {
      await api.post(`/shifts/${activeShift._id}/cash-event`, cashEvent);
      toast.success(`${cashEvent.type === "paid_in" ? "Paid in" : "Paid out"} $${cashEvent.amount}`);
      setCashEventModal(false); setCashEvent({ type: "paid_in", amount: "", reason: "" }); load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950 p-5">
      <div className="max-w-3xl mx-auto space-y-5">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Clock size={20} className="text-white"/></div>
          <div><h1 className="text-xl font-bold">Shift / Z-Report</h1><p className="text-xs text-gray-500">Manage shifts and cash drawer</p></div>
        </div>

        {/* No active shift */}
        {!activeShift && (
          <div className={`${CARD} p-6 space-y-4`}>
            <h2 className="font-semibold text-lg">Open New Shift</h2>
            <div>
              <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
                <input type="checkbox" checked={useDenomsOpen} onChange={e => setUseDenomsOpen(e.target.checked)} className="rounded"/>
                Count opening float by denominations
              </label>
              {!useDenomsOpen ? (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Opening Float ($)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={openFloat} onChange={e => setOpenFloat(e.target.value)}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 bg-transparent text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              ) : (
                <DenominationCounter value={openDenoms} onChange={setOpenDenoms} label="Count bills in drawer (LBP)"/>
              )}
            </div>
            <button onClick={handleOpen} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition">Open Shift</button>
          </div>
        )}

        {/* Active shift */}
        {activeShift && (
          <div className="space-y-4">
            <div className={`${CARD} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"/>
                  <span className="font-semibold">Shift Active</span>
                  <span className="text-xs text-gray-500">since {new Date(activeShift.openedAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCashEventModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 transition">
                    <DollarSign size={12}/> Cash In/Out
                  </button>
                  <button onClick={() => setShowClose(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition">
                    <X size={12}/> Close Shift
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Opening Float", value: formatUSD(activeShift.openingFloat || 0) },
                  { label: "Paid In",       value: formatUSD(activeShift.paidIn || 0) },
                  { label: "Paid Out",      value: formatUSD(activeShift.paidOut || 0) },
                  { label: "Opened",        value: new Date(activeShift.openedAt).toLocaleTimeString() },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 text-center">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Cash drawer events */}
              {activeShift.cashDrawerEvents?.length > 1 && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cash Drawer Events</p>
                  {activeShift.cashDrawerEvents.slice(1).map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                      <span className={`flex items-center gap-1 font-medium ${ev.type === "paid_in" ? "text-green-600" : "text-orange-600"}`}>
                        {ev.type === "paid_in" ? <ArrowUpCircle size={12}/> : <ArrowDownCircle size={12}/>}
                        {ev.type === "paid_in" ? "Paid In" : "Paid Out"}
                      </span>
                      <span className="font-bold">${ev.amount?.toFixed(2)}</span>
                      <span className="text-gray-400">{ev.reason}</span>
                      <span className="text-gray-400">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close shift modal */}
            {showClose && (
              <div className={`${CARD} p-5 space-y-4 border-2 border-red-200 dark:border-red-500/30`}>
                <h2 className="font-semibold text-red-600 flex items-center gap-2"><AlertTriangle size={16}/> Close Shift</h2>
                <div>
                  <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
                    <input type="checkbox" checked={useDenomsClose} onChange={e => setUseDenomsClose(e.target.checked)} className="rounded"/>
                    Count closing cash by denominations
                  </label>
                  {!useDenomsClose ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Counted Cash ($) — leave blank to skip</label>
                      <input type="number" min="0" step="0.01" placeholder="Enter actual cash in drawer" value={closeCount} onChange={e => setCloseCount(e.target.value)}
                        className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 bg-transparent text-sm outline-none focus:ring-2 focus:ring-red-400"/>
                    </div>
                  ) : (
                    <DenominationCounter value={closeDenoms} onChange={setCloseDenoms} label="Count bills in drawer (LBP)"/>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Notes</label>
                  <textarea rows={2} placeholder="Any shift notes..." value={closeNotes} onChange={e => setCloseNotes(e.target.value)}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 bg-transparent text-sm outline-none resize-none focus:ring-2 focus:ring-red-400"/>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleClose} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition">Close & Print Z-Report</button>
                  <button onClick={() => setShowClose(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past shifts */}
        {shifts.filter(s => s.status === "closed").length > 0 && (
          <div className={`${CARD} overflow-hidden`}>
            <div className="px-5 py-4 border-b dark:border-white/10 flex items-center justify-between">
              <span className="font-semibold text-sm">Past Shifts</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {shifts.filter(s => s.status === "closed").slice(0, 10).map(shift => (
                <div key={shift._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => setZReport(shift)}>
                  <div>
                    <p className="text-sm font-medium">{shift.username}</p>
                    <p className="text-xs text-gray-400">{new Date(shift.openedAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{formatUSD(shift.netRevenue || 0)}</p>
                    <p className="text-xs text-gray-400">{shift.totalOrders} orders</p>
                  </div>
                  {shift.variance != null && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Math.abs(shift.variance) < 0.01 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {shift.variance >= 0 ? "+" : ""}${shift.variance?.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Z-Report modal */}
      {zReport && <ZReport shift={zReport} onClose={() => setZReport(null)}/>}

      {/* Cash In/Out modal */}
      {cashEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setCashEventModal(false); }}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold mb-4">Cash Drawer Event</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Type</label>
                <select value={cashEvent.type} onChange={e => setCashEvent(f => ({ ...f, type: e.target.value }))} className="w-full border dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none">
                  <option value="paid_in">Paid In (add cash to drawer)</option>
                  <option value="paid_out">Paid Out (remove cash from drawer)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Amount ($)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={cashEvent.amount} onChange={e => setCashEvent(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Reason</label>
                <input type="text" placeholder="e.g. Petty cash, bank deposit..." value={cashEvent.reason} onChange={e => setCashEvent(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border dark:border-white/10 rounded-xl px-3 py-2 bg-transparent text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCashEvent} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition">Confirm</button>
                <button onClick={() => setCashEventModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}