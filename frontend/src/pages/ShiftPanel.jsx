import React, { useEffect, useState } from "react";
import { getActiveShift, getShifts, openShift, closeShift } from "../api/shift.api";
import { useCurrency } from "../context/CurrencyContext";
import toast from "react-hot-toast";
import {
  Clock, DollarSign, TrendingUp, X, CheckCircle2,
  AlertTriangle, BarChart3, CreditCard, RotateCcw, Plus
} from "lucide-react";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";

function ZReport({ shift, onClose }) {
  const { formatUSD } = useCurrency();
  const fmtTime = d => new Date(d).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });

  const printReport = () => {
    const win = window.open("", "_blank", "width=360,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Z-Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:13px;color:#111;width:80mm;padding:6mm 3mm}
.c{text-align:center}.b{font-weight:900}hr{border:none;border-top:1px dashed #aaa;margin:6px 0}
.row{display:flex;justify-content:space-between;padding:2px 0}.warn{color:#b45309;font-weight:700}
@media print{@page{size:80mm auto;margin:0}body{padding:4mm 2mm}}</style></head><body>
<div class="c"><p class="b" style="font-size:18px">Z-REPORT</p>
<p>${fmtTime(shift.openedAt)} → ${fmtTime(shift.closedAt)}</p>
<p>Cashier: ${shift.username || shift.userId}</p></div>
<hr/>
<div class="row"><span>Total Orders</span><span>${shift.totalOrders}</span></div>
<div class="row"><span>Gross Revenue</span><span>$${shift.totalSales?.toFixed(2)}</span></div>
<div class="row"><span>Refunds</span><span>−$${shift.totalRefunds?.toFixed(2)}</span></div>
<div class="row b"><span>Net Revenue</span><span>$${shift.netRevenue?.toFixed(2)}</span></div>
<hr/>
<div class="row"><span>Cash Sales</span><span>$${shift.cashSales?.toFixed(2)}</span></div>
<div class="row"><span>Card Sales</span><span>$${shift.cardSales?.toFixed(2)}</span></div>
<div class="row"><span>Pay Later</span><span>$${shift.payLaterSales?.toFixed(2)}</span></div>
<hr/>
<div class="row"><span>Opening Float</span><span>$${shift.openingFloat?.toFixed(2)}</span></div>
<div class="row"><span>Expected Cash</span><span>$${shift.expectedCash?.toFixed(2)}</span></div>
${shift.closingCount != null ? `<div class="row"><span>Counted Cash</span><span>$${shift.closingCount?.toFixed(2)}</span></div>
<div class="row ${shift.variance < 0 ? 'warn' : ''}"><span>Variance</span><span>${shift.variance >= 0 ? '+' : ''}$${shift.variance?.toFixed(2)}</span></div>` : ""}
<hr/>
<p style="text-align:center;font-size:10px;color:#999;margin-top:8px">End of Shift Report</p>
<script>window.onload=()=>{window.print();window.close();}<\/script>
</body></html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-indigo-600 px-6 py-6 text-center">
          <BarChart3 size={36} className="text-white mx-auto mb-2" strokeWidth={1.5}/>
          <h2 className="text-white text-xl font-bold">Z-Report</h2>
          <p className="text-indigo-200 text-sm mt-1">
            {new Date(shift.openedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})} · {shift.username}
          </p>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Net Revenue",  value: formatUSD(shift.netRevenue || 0),    color:"text-green-600 dark:text-green-400"  },
              { label:"Total Orders", value: shift.totalOrders || 0,              color:"text-blue-600 dark:text-blue-400"    },
              { label:"Refunds",      value: formatUSD(shift.totalRefunds || 0),  color:"text-red-600 dark:text-red-400"      },
              { label:"Avg Sale",     value: shift.totalOrders ? formatUSD((shift.totalSales || 0) / shift.totalOrders) : "$0.00", color:"text-purple-600 dark:text-purple-400" },
            ].map(k => (
              <div key={k.label} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 text-center">
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Payment breakdown */}
          <div className={`${CARD} p-4 space-y-2`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Payment Breakdown</p>
            {[
              { label:"Cash", value: shift.cashSales || 0, color:"text-green-600" },
              { label:"Card", value: shift.cardSales || 0, color:"text-blue-600"  },
              { label:"Pay Later", value: shift.payLaterSales || 0, color:"text-purple-600" },
            ].map(p => (
              <div key={p.label} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{p.label}</span>
                <span className={`font-semibold ${p.color}`}>{formatUSD(p.value)}</span>
              </div>
            ))}
          </div>

          {/* Cash reconciliation */}
          <div className={`${CARD} p-4 space-y-2`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Cash Reconciliation</p>
            {[
              { label:"Opening Float", value: shift.openingFloat || 0 },
              { label:"Cash Sales",    value: shift.cashSales || 0    },
              { label:"Expected",      value: shift.expectedCash || 0, bold: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
                <span className={r.bold ? "font-bold" : ""}>{formatUSD(r.value)}</span>
              </div>
            ))}
            {shift.closingCount != null && (
              <>
                <div className="flex justify-between text-sm border-t border-dashed border-gray-200 dark:border-white/10 pt-2">
                  <span className="text-gray-500 dark:text-gray-400">Counted Cash</span>
                  <span className="font-semibold">{formatUSD(shift.closingCount)}</span>
                </div>
                <div className={`flex justify-between text-sm font-bold ${shift.variance < 0 ? "text-red-600 dark:text-red-400" : shift.variance > 0 ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>
                  <span>Variance</span>
                  <span>{shift.variance >= 0 ? "+" : ""}{formatUSD(shift.variance)}</span>
                </div>
                {Math.abs(shift.variance) > 0.5 && (
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={12}/> Cash variance detected — investigate discrepancy
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-gray-100 dark:border-white/5 flex gap-3">
          <button onClick={printReport}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition text-sm">
            Print Z-Report
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 font-semibold transition text-sm">
            Close
          </button>
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
  const [showOpen,    setShowOpen]    = useState(false);
  const [showClose,   setShowClose]   = useState(false);
  const [viewReport,  setViewReport]  = useState(null);
  const [floatInput,  setFloatInput]  = useState("0");
  const [countInput,  setCountInput]  = useState("");
  const [notesInput,  setNotesInput]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [active, all] = await Promise.all([getActiveShift(), getShifts()]);
      setActiveShift(active);
      setShifts(all);
    } catch { toast.error("Failed to load shifts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async () => {
    setSubmitting(true);
    try {
      const shift = await openShift({ openingFloat: parseFloat(floatInput) || 0 });
      setActiveShift(shift);
      setShifts(prev => [shift, ...prev]);
      setShowOpen(false);
      toast.success("Shift opened");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleClose = async () => {
    if (!activeShift) return;
    setSubmitting(true);
    try {
      const closed = await closeShift(activeShift._id, {
        closingCount: countInput !== "" ? parseFloat(countInput) : null,
        notes: notesInput,
      });
      setActiveShift(null);
      setShifts(prev => prev.map(s => s._id === closed._id ? closed : s));
      setShowClose(false);
      setViewReport(closed);
      toast.success("Shift closed");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const fmtTime = d => new Date(d).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
  const duration = (open, close) => {
    const ms = new Date(close || Date.now()) - new Date(open);
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Clock size={22} className="text-indigo-500"/> Shift Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cash drawer · Z-Reports · Shift history</p>
          </div>
          {!activeShift
            ? <button onClick={() => setShowOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition"><Plus size={16}/> Open Shift</button>
            : <button onClick={() => setShowClose(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition"><X size={16}/> Close Shift</button>
          }
        </div>

        {/* Active shift card */}
        {activeShift ? (
          <div className={`${CARD} p-5 border-2 border-indigo-300 dark:border-indigo-700`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"/>
              </div>
              <div>
                <p className="font-bold text-indigo-700 dark:text-indigo-400">Shift Active</p>
                <p className="text-xs text-gray-400">Started {fmtTime(activeShift.openedAt)} · {duration(activeShift.openedAt, null)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatUSD(activeShift.openingFloat)}</p>
                <p className="text-xs text-gray-400">Opening float</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{duration(activeShift.openedAt, null)}</p>
                <p className="text-xs text-gray-400">Duration</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${CARD} p-8 text-center`}>
            <Clock size={36} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-400 text-sm">No active shift — open one to start tracking sales</p>
          </div>
        )}

        {/* Shift history */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Shift History</p>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : (
            <div className="space-y-3">
              {shifts.filter(s => s.status === "closed").map(s => (
                <div key={s._id} className={`${CARD} p-4 flex items-center gap-4`}>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] flex items-center justify-center shrink-0">
                    <BarChart3 size={16} className="text-gray-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{formatUSD(s.netRevenue || 0)}</span>
                      <span className="text-xs text-gray-400">· {s.totalOrders} orders · {duration(s.openedAt, s.closedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtTime(s.openedAt)} → {fmtTime(s.closedAt)} · {s.username}
                    </p>
                    {s.variance != null && Math.abs(s.variance) > 0.5 && (
                      <span className={`text-xs font-semibold ${s.variance < 0 ? "text-red-500" : "text-green-500"}`}>
                        Variance: {s.variance >= 0 ? "+" : ""}{formatUSD(s.variance)}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setViewReport(s)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#1c1c1c] text-xs font-semibold hover:bg-gray-200 transition">
                    Z-Report
                  </button>
                </div>
              ))}
              {shifts.filter(s => s.status === "closed").length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No closed shifts yet</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Open shift modal */}
      {showOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="font-bold">Open Shift</h2>
              <button onClick={() => setShowOpen(false)}><X size={16} className="text-gray-400"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Opening Float ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input value={floatInput} onChange={e => setFloatInput(e.target.value)} type="number" min="0"
                    className="w-full pl-8 pr-3 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-indigo-400 outline-none text-lg font-bold transition"/>
                </div>
                <p className="text-xs text-gray-400 mt-1">Cash placed in drawer before first sale</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 font-semibold">Cancel</button>
                <button onClick={handleOpen} disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50">
                  {submitting ? "Opening..." : "Open Shift"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close shift modal */}
      {showClose && activeShift && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h2 className="font-bold">Close Shift</h2>
              <button onClick={() => setShowClose(false)}><X size={16} className="text-gray-400"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Count Cash in Drawer ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input value={countInput} onChange={e => setCountInput(e.target.value)} type="number" min="0"
                    placeholder="Optional — leave blank to skip"
                    className="w-full pl-8 pr-3 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-red-400 outline-none text-base font-bold transition"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
                <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} rows={2}
                  placeholder="Any observations..."
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-red-400 outline-none text-sm transition resize-none"/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowClose(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 font-semibold">Cancel</button>
                <button onClick={handleClose} disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50">
                  {submitting ? "Closing..." : "Close Shift"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewReport && <ZReport shift={viewReport} onClose={() => setViewReport(null)} />}
    </div>
  );
}