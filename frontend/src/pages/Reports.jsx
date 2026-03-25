import React, { useEffect, useState, useMemo } from "react";
import { useRefresh } from "../context/RefreshContext";
import { useLang } from "../context/LanguageContext";
import { useReportsTranslation } from "../hooks/useReportsTranslation";
import api from "../api/axios";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, ShoppingCart, CreditCard, Clock,
  DollarSign, AlertCircle, AlertTriangle, Package, Bell
} from "lucide-react";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";
const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6"];
const METHOD_COLOR = {
  cash:    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  card:    "bg-blue-100  dark:bg-blue-900/30  text-blue-700  dark:text-blue-300",
  paylater:"bg-red-100   dark:bg-red-900/30   text-red-700   dark:text-red-300",
};

export default function Reports() {
  const { tick }      = useRefresh();
  const { lang }      = useLang();
  const t             = useReportsTranslation();
  const isAr          = lang === "ar";

  const [sales,     setSales]     = useState([]);
  const [holdSales, setHoldSales] = useState([]);
  const [alerts,    setAlerts]    = useState({ lowStock: [], expiring: [] });
  const [loading,   setLoading]   = useState(true);
  const [period,    setPeriod]    = useState("week");
  const [tab,       setTab]       = useState("overview");

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, hRes, aRes] = await Promise.all([
          api.get("/sales"),
          api.get("/hold-sales"),
          api.get("/products/alerts"),
        ]);
        setSales(sRes.data);
        setHoldSales(hRes.data);
        setAlerts(aRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tick]);

  /* ── Filter by period ── */
  const filteredSales = useMemo(() => {
    const cutoff = new Date();
    if (period === "day") cutoff.setHours(0, 0, 0, 0);
    else cutoff.setDate(cutoff.getDate() - 7);
    return sales.filter(s => new Date(s.createdAt) >= cutoff);
  }, [sales, period]);

  /* ── KPIs ── */
  const totalRevenue      = useMemo(() => filteredSales.reduce((s, x) => s + x.total, 0), [filteredSales]);
  const cashRevenue       = useMemo(() => filteredSales.filter(s => s.paymentMethod === "cash").reduce((s, x) => s + x.total, 0), [filteredSales]);
  const cardRevenue       = useMemo(() => filteredSales.filter(s => s.paymentMethod === "card").reduce((s, x) => s + x.total, 0), [filteredSales]);
  const payLaterTotal     = useMemo(() => filteredSales.filter(s => s.paymentMethod === "paylater").reduce((s, x) => s + x.total, 0), [filteredSales]);
  const avgSale           = filteredSales.length ? totalRevenue / filteredSales.length : 0;
  const outstandingCredit = useMemo(() => holdSales.reduce((s, h) => s + (h.balance || 0), 0), [holdSales]);
  const totalCreditGiven  = useMemo(() => holdSales.reduce((s, h) => s + (h.total   || 0), 0), [holdSales]);
  const totalCreditPaid   = useMemo(() => holdSales.reduce((s, h) => s + (h.paid    || 0), 0), [holdSales]);

  /* ── Charts ── */
  const revenueChart = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const d = new Date(s.createdAt);
      const key = period === "day"
        ? `${d.getHours()}:00`
        : d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" });
      if (!map[key]) map[key] = { label: key, revenue: 0, count: 0 };
      map[key].revenue += s.total;
      map[key].count   += 1;
    });
    return Object.values(map);
  }, [filteredSales, period, isAr]);

  const paymentBreakdown = useMemo(() => {
    const map = { cash: 0, card: 0, paylater: 0 };
    filteredSales.forEach(s => { map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total; });
    return [
      { name: t.cash,   value: +map.cash.toFixed(2)     },
      { name: t.card,   value: +map.card.toFixed(2)     },
      { name: t.credit, value: +map.paylater.toFixed(2) },
    ].filter(x => x.value > 0);
  }, [filteredSales, t]);

  const topProducts = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        const name = item.name || t.unknown;
        if (!map[name]) map[name] = { name, qty: 0, revenue: 0 };
        map[name].qty     += item.quantity;
        map[name].revenue += (item.subtotal || item.price * item.quantity);
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [filteredSales, t]);

  const hourlyData = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const h   = new Date(s.createdAt).getHours();
      const key = `${String(h).padStart(2,"0")}:00`;
      if (!map[key]) map[key] = { hour: key, sales: 0, count: 0 };
      map[key].sales += s.total;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => a.hour.localeCompare(b.hour));
  }, [filteredSales]);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
      {t.loading}
    </div>
  );

  const dir = isAr ? "rtl" : "ltr";

  /* ── Reusable empty state ── */
  const Empty = ({ msg }) => (
    <div className="py-10 text-center text-gray-400 text-sm">{msg || t.noData}</div>
  );

  /* ── Period toggle ── */
  const PeriodToggle = () => (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1c1c1c] rounded-xl p-1">
      {[["day", t.today], ["week", t.thisWeek]].map(([val, label]) => (
        <button key={val} onClick={() => setPeriod(val)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${period === val
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div dir={dir} className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-neutral-950">
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">

          {/* ── HEADER ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp size={22} className="text-blue-500" />
                {t.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredSales.length} {t.transactionsDesc} ·{" "}
                {period === "day" ? t.today : t.thisWeek}
              </p>
            </div>
            <PeriodToggle />
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-white/10">
            {[
              ["overview",     t.tabOverview,     <TrendingUp   size={14}/>],
              ["paylater",     t.tabPayLater,     <CreditCard   size={14}/>],
              ["transactions", t.tabTransactions, <ShoppingCart size={14}/>],
              ["alerts",       t.tabAlerts,       <Bell         size={14}/>],
            ].map(([key, label, icon]) => {
              const alertCount = key === "alerts" ? alerts.lowStock.length + alerts.expiring.length : 0;
              return (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px
                    ${tab === key
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                  {icon}{label}
                  {alertCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ══════════════════
              OVERVIEW
          ══════════════════ */}
          {tab === "overview" && (
            <div className="space-y-5">

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t.totalRevenue, value: `$${totalRevenue.toFixed(2)}`,      icon: <DollarSign   size={18}/>, color: "text-green-600  dark:text-green-400",  bg: "bg-green-50  dark:bg-green-900/20"  },
                  { label: t.totalSales,   value: filteredSales.length,               icon: <ShoppingCart size={18}/>, color: "text-blue-600   dark:text-blue-400",   bg: "bg-blue-50   dark:bg-blue-900/20"   },
                  { label: t.averageSale,  value: `$${avgSale.toFixed(2)}`,           icon: <TrendingUp   size={18}/>, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
                  { label: t.outstanding,  value: `$${outstandingCredit.toFixed(2)}`, icon: <AlertCircle  size={18}/>, color: "text-red-600    dark:text-red-400",    bg: "bg-red-50    dark:bg-red-900/20"    },
                ].map(({ label, value, icon, color, bg }) => (
                  <div key={label} className={`${CARD} ${bg} p-4`}>
                    <div className={`${color} mb-2`}>{icon}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue trend */}
              <div className={`${CARD} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">{t.revenueTrend}</h3>
                  <span className="text-xs text-gray-400">
                    {period === "day" ? t.byHour : t.byDay}
                  </span>
                </div>
                {revenueChart.length === 0 ? <Empty msg={t.noSales}/> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
                      <YAxis tick={{ fontSize: 11 }}/>
                      <Tooltip formatter={v => [`$${v.toFixed(2)}`, t.revenue]}/>
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top products + Payment breakdown */}
              <div className="grid md:grid-cols-2 gap-5">

                <div className={`${CARD} p-5`}>
                  <h3 className="font-semibold text-sm mb-4">{t.topProducts}</h3>
                  {topProducts.length === 0 ? <Empty/> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                        <XAxis type="number" tick={{ fontSize: 10 }}/>
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80}/>
                        <Tooltip/>
                        <Bar dataKey="qty" fill="#6366f1" radius={[0,4,4,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className={`${CARD} p-5`}>
                  <h3 className="font-semibold text-sm mb-4">{t.paymentMethods}</h3>
                  {paymentBreakdown.length === 0 ? <Empty/> : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={paymentBreakdown} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" outerRadius={65}
                            label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                            {paymentBreakdown.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                            ))}
                          </Pie>
                          <Tooltip formatter={v => `$${v.toFixed(2)}`}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[
                          { label: t.cash,   value: cashRevenue,   color: "text-green-600" },
                          { label: t.card,   value: cardRevenue,   color: "text-blue-600"  },
                          { label: t.credit, value: payLaterTotal, color: "text-red-600"   },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center bg-gray-50 dark:bg-[#1c1c1c] rounded-xl p-2">
                            <p className="text-xs text-gray-400">{label}</p>
                            <p className={`text-sm font-bold ${color}`}>${value.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Hourly activity */}
              <div className={`${CARD} p-5`}>
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-amber-500"/>
                  {t.hourlySales}
                </h3>
                {hourlyData.length === 0 ? <Empty/> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }}/>
                      <YAxis tick={{ fontSize: 11 }}/>
                      <Tooltip formatter={v => [`$${v.toFixed(2)}`, t.revenue]}/>
                      <Bar dataKey="sales" fill="#f59e0b" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════
              PAY LATER
          ══════════════════ */}
          {tab === "paylater" && (
            <div className="space-y-5">

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t.totalCreditGiven, value: `$${totalCreditGiven.toFixed(2)}`,   color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
                  { label: t.totalPaidBack,     value: `$${totalCreditPaid.toFixed(2)}`,    color: "text-green-600  dark:text-green-400",  bg: "bg-green-50  dark:bg-green-900/20"  },
                  { label: t.outstandingBal,    value: `$${outstandingCredit.toFixed(2)}`,  color: "text-red-600    dark:text-red-400",    bg: "bg-red-50    dark:bg-red-900/20"    },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${CARD} ${bg} p-5`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Pay later sales in period */}
              <div className={`${CARD} p-5`}>
                <h3 className="font-semibold text-sm mb-1">
                  {t.payLaterSales} — {period === "day" ? t.today : t.thisWeek}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{t.payLaterPeriodDesc}</p>

                {filteredSales.filter(s => s.paymentMethod === "paylater").length === 0
                  ? <Empty msg={t.noPayLaterSales}/>
                  : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-white/10 text-xs text-gray-400">
                          <th className="pb-2 text-start">{t.date}</th>
                          <th className="pb-2 text-center">{t.items}</th>
                          <th className="pb-2 text-end">{t.total}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {filteredSales.filter(s => s.paymentMethod === "paylater").map(s => (
                          <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="py-2.5 text-gray-500 dark:text-gray-400">
                              {new Date(s.createdAt).toLocaleString(isAr ? "ar-SA" : "en-US")}
                            </td>
                            <td className="py-2.5 text-center">
                              {s.items.reduce((a, i) => a + i.quantity, 0)}
                            </td>
                            <td className="py-2.5 text-end font-semibold text-red-500">
                              ${s.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 dark:border-white/10">
                          <td className="pt-3 font-semibold text-xs text-gray-500" colSpan={2}>
                            {t.periodTotal}
                          </td>
                          <td className="pt-3 text-end font-bold text-red-600">
                            ${payLaterTotal.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )
                }
              </div>

              {/* Open credit accounts */}
              <div className={`${CARD} p-5`}>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500"/>
                  {t.openAccounts}
                </h3>
                <p className="text-xs text-gray-400 mb-4">{t.openAccountsDesc}</p>

                {holdSales.length === 0
                  ? <Empty msg={t.noOpenAccounts}/>
                  : (
                    <div className="space-y-3">
                      {holdSales.map(h => (
                        <div key={h._id}
                          className="flex items-center justify-between p-3 rounded-xl
                            bg-gray-50 dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/5">
                          <div>
                            <p className="font-semibold text-sm">{h.customerName}</p>
                            {h.phone && <p className="text-xs text-gray-400">{h.phone}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {t.total}: ${h.total?.toFixed(2)} · {t.paid}: ${h.paid?.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-end">
                            <p className="font-bold text-red-500 text-lg">${h.balance?.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">{t.balance}</p>
                            <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.min(100,(h.paid/h.total)*100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {h.total > 0 ? Math.round((h.paid/h.total)*100) : 0}% {t.paid}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}

          {/* ══════════════════
              TRANSACTIONS
          ══════════════════ */}
          {tab === "transactions" && (
            <div className="space-y-4">

              <p className="text-sm text-gray-500">
                {filteredSales.length} {t.transactionsDesc} ·{" "}
                {t.total}: <span className="font-bold text-green-600">${totalRevenue.toFixed(2)}</span>
              </p>

              <div className={`${CARD} overflow-hidden`}>
                {filteredSales.length === 0
                  ? <Empty msg={t.noSales}/>
                  : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-[#1c1c1c] text-xs text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-5 py-3 text-start">{t.date}</th>
                          <th className="px-5 py-3 text-start">{t.items}</th>
                          <th className="px-5 py-3 text-end">{t.total}</th>
                          <th className="px-5 py-3 text-center">{t.payment}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {filteredSales.map(sale => (
                          <tr key={sale._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {new Date(sale.createdAt).toLocaleString(isAr ? "ar-SA" : "en-US")}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-1">
                                {sale.items.slice(0,3).map((item, i) => (
                                  <span key={i} className="text-xs bg-gray-100 dark:bg-[#252525] px-2 py-0.5 rounded-full">
                                    {item.name} ×{item.quantity}
                                  </span>
                                ))}
                                {sale.items.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{sale.items.length - 3} {t.more}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-end font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                              ${sale.total.toFixed(2)}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                ${METHOD_COLOR[sale.paymentMethod] || "bg-gray-100 text-gray-600"}`}>
                                {sale.paymentMethod === "cash"     ? t.cash
                                 : sale.paymentMethod === "card"   ? t.card
                                 : sale.paymentMethod === "paylater" ? t.credit
                                 : sale.paymentMethod}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-[#1c1c1c]">
                        <tr>
                          <td className="px-5 py-3 font-semibold text-xs text-gray-500" colSpan={2}>
                            {filteredSales.length} {t.transactionsDesc}
                          </td>
                          <td className="px-5 py-3 text-end font-bold text-green-600">
                            ${totalRevenue.toFixed(2)}
                          </td>
                          <td/>
                        </tr>
                      </tfoot>
                    </table>
                  )
                }
              </div>
            </div>
          )}

          {/* ══════════════════
              ALERTS
          ══════════════════ */}
          {tab === "alerts" && (() => {
            const totalAlerts = alerts.lowStock.length + alerts.expiring.length;

            const expiryBadge = (daysLeft) => {
              if (daysLeft < 0)   return { label: t.alertBadgeExpired,  cls: "bg-red-600    text-white" };
              if (daysLeft === 0) return { label: t.today_exp,          cls: "bg-red-600    text-white" };
              if (daysLeft <= 7)  return { label: t.alertBadgeCritical, cls: "bg-red-500    text-white" };
              if (daysLeft <= 14) return { label: t.alertBadgeWarning,  cls: "bg-amber-500  text-white" };
              return                     { label: t.alertBadgeSoon,     cls: "bg-yellow-400 text-yellow-900" };
            };

            const stockBadge = (stock) => {
              if (stock === 0) return { label: "OUT",                cls: "bg-red-600   text-white" };
              if (stock <= 2)  return { label: t.alertBadgeCritical, cls: "bg-red-500   text-white" };
              return                  { label: t.alertBadgeWarning,  cls: "bg-amber-500 text-white" };
            };

            const fmtDate = (d) => new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "short", year: "numeric" });

            return (
              <div className="space-y-5">

                {/* Summary banner */}
                {totalAlerts === 0 ? (
                  <div className={`${CARD} p-8 text-center`}>
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                      <AlertCircle size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-semibold text-green-700 dark:text-green-400">{t.noAlerts}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${CARD} p-4 bg-amber-50 dark:bg-amber-900/15`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Package size={16} className="text-amber-600 dark:text-amber-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.lowStockAlerts}</p>
                      </div>
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{alerts.lowStock.length}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.lowStockDesc}</p>
                    </div>
                    <div className={`${CARD} p-4 bg-red-50 dark:bg-red-900/15`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.expiryAlerts}</p>
                      </div>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{alerts.expiring.length}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.expiryDesc}</p>
                    </div>
                  </div>
                )}

                {/* ── LOW STOCK ── */}
                <div className={`${CARD} overflow-hidden`}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-amber-500" />
                      <h3 className="font-semibold text-sm">{t.lowStockAlerts}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                        {alerts.lowStock.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{t.lowStockDesc}</p>
                  </div>

                  {alerts.lowStock.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">{t.noLowStock} ✓</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-[#1c1c1c] text-xs text-gray-400">
                        <tr>
                          <th className="px-5 py-3 text-start">{t.unknown === "Unknown" ? "Product" : "المنتج"}</th>
                          <th className="px-5 py-3 text-start">{t.category}</th>
                          <th className="px-5 py-3 text-center">{t.stockLevel}</th>
                          <th className="px-5 py-3 text-end">{t.price}</th>
                          <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {alerts.lowStock.map(p => {
                          const { label, cls } = stockBadge(p.stock);
                          return (
                            <tr key={p._id} className={`transition-colors ${p.stock === 0 ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  {p.image ? (
                                    <img src={p.image} className="w-8 h-8 rounded-lg object-cover" onError={e => e.target.style.display="none"} />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#252525] flex items-center justify-center">
                                      <Package size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                  <span className="font-medium">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{p.category || "—"}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`text-lg font-bold ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>{p.stock}</span>
                                <span className="text-xs text-gray-400 block">{t.unitsLeft}</span>
                              </td>
                              <td className="px-5 py-3 text-end font-semibold text-green-600 dark:text-green-400">${p.price.toFixed(2)}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* ── EXPIRING SOON ── */}
                <div className={`${CARD} overflow-hidden`}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <h3 className="font-semibold text-sm">{t.expiryAlerts}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        {alerts.expiring.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{t.expiryDesc}</p>
                  </div>

                  {alerts.expiring.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">{t.noExpiry} ✓</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-[#1c1c1c] text-xs text-gray-400">
                        <tr>
                          <th className="px-5 py-3 text-start">{t.unknown === "Unknown" ? "Product" : "المنتج"}</th>
                          <th className="px-5 py-3 text-start">{t.category}</th>
                          <th className="px-5 py-3 text-center">{t.stockLevel}</th>
                          <th className="px-5 py-3 text-center">{t.expiryDate}</th>
                          <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {alerts.expiring.map(p => {
                          const { label, cls } = expiryBadge(p.daysLeft);
                          const rowBg = p.expired
                            ? "bg-red-50/60 dark:bg-red-900/15"
                            : p.daysLeft <= 7
                            ? "bg-orange-50/40 dark:bg-orange-900/10"
                            : "";
                          return (
                            <tr key={p._id} className={`transition-colors ${rowBg}`}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  {p.image ? (
                                    <img src={p.image} className="w-8 h-8 rounded-lg object-cover" onError={e => e.target.style.display="none"} />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#252525] flex items-center justify-center">
                                      <Package size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                  <span className="font-medium">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{p.category || "—"}</td>
                              <td className="px-5 py-3 text-center">
                                <span className="font-semibold">{p.stock}</span>
                                <span className="text-xs text-gray-400 block">{t.unitsLeft}</span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={`font-semibold text-sm block ${p.expired ? "text-red-600" : p.daysLeft <= 7 ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}>
                                  {fmtDate(p.expiryDate)}
                                </span>
                                <span className={`text-xs ${p.expired ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                                  {p.expired
                                    ? `${Math.abs(p.daysLeft)} ${t.days} ago`
                                    : p.daysLeft === 0
                                    ? t.today_exp
                                    : p.daysLeft === 1
                                    ? t.tomorrow
                                    : `${t.expiresIn} ${p.daysLeft} ${t.days}`}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}