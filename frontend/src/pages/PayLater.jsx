import { useEffect, useState } from "react";
import api from "../api/axios";
import { useRefresh } from "../context/RefreshContext";
import { useLang } from "../context/LanguageContext";
import { usePayLaterTranslation } from "../hooks/usePayLaterTranslation";
import ReceivePaymentModal from "../components/ReceivePaymentModal";
import RecentPayments from "../components/RecentPayments";
import Avatar from "../components/Avatar";
import EditCustomerModal from "../components/EditCustomerModal";
import CustomerPaymentsDrawer from "../components/CustomerPaymentsDrawer";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Search, DollarSign, Users, TrendingDown,
  Pencil, History, ChevronRight, AlertCircle
} from "lucide-react";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";

export default function PayLater() {
  const t    = usePayLaterTranslation();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const { tick } = useRefresh();

  const [sales,           setSales]           = useState([]);
  const [search,          setSearch]          = useState("");
  const [selected,        setSelected]        = useState(null);
  const [editCustomer,    setEditCustomer]    = useState(null);
  const [drawerCustomer,  setDrawerCustomer]  = useState(null);
  const [editingLimit,    setEditingLimit]    = useState(null);
  const [newLimit,        setNewLimit]        = useState("");
  const [monthlyPayCount, setMonthlyPayCount] = useState(0);

  useEffect(() => { load(); }, [tick]);

  const load = async () => {
    try {
      const [salesRes, monthRes] = await Promise.all([
        api.get("/hold-sales"),
        api.get("/hold-sales/payments/month"),
      ]);
      setSales(salesRes.data);
      setMonthlyPayCount(monthRes.data.length);
    } catch {}
  };

  const filtered = sales.filter(s =>
    s.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = filtered.reduce((s, x) => s + x.balance, 0);

  const updateLimit = async (id) => {
    await api.patch(`/hold-sales/${id}/limit`, { creditLimit: Number(newLimit) });
    setEditingLimit(null);
    load();
  };

  // Risk level per account
  const riskLevel = (s) => {
    const pct = s.total > 0 ? s.balance / s.total : 0;
    if (pct >= 0.9) return { color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20",    label: "High"   };
    if (pct >= 0.5) return { color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", label: "Mid" };
    return               { color: "text-green-500",   bg: "bg-green-50 dark:bg-green-900/20", label: "Low"    };
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950">
      <div className="p-5 space-y-5">

        {/* ── HEADER ── */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard size={22} className="text-blue-500"/> {t.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.subtitle}</p>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: t.accountsDebt,     value: filtered.length,                   icon: <Users size={18}/>,       color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20"    },
            { title: t.totalOutstanding, value: `$${totalOutstanding.toFixed(2)}`, icon: <TrendingDown size={18}/>, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
            { title: t.paymentsMonth,    value: monthlyPayCount,                   icon: <DollarSign size={18}/>,  color: "text-green-600 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20"   },
          ].map(({ title, value, icon, color, bg }) => (
            <motion.div key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`${CARD} ${bg} p-5`}>
              <div className={`${color} mb-2`}>{icon}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-5">

          {/* ── LEFT: Accounts ── */}
          <div className="col-span-12 lg:col-span-8 space-y-4">

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400"/>
              <input
                placeholder={t.searchCustomers}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full ps-10 pe-4 py-3 rounded-xl text-sm
                  bg-white dark:bg-[#141414]
                  border border-gray-200 dark:border-white/10
                  focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Account cards */}
            {filtered.length === 0 ? (
              <div className={`${CARD} p-14 text-center text-gray-400`}>
                <CreditCard size={36} className="opacity-20 mx-auto mb-3"/>
                <p className="text-sm font-medium">{t.noAccounts}</p>
                <p className="text-xs mt-1 opacity-60">{t.subtitle}</p>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((s, i) => {
                  const limit     = s.creditLimit || 500;
                  const available = limit - s.balance;
                  const paidPct   = s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0;
                  const risk      = riskLevel(s);

                  return (
                    <motion.div key={s._id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`${CARD} p-5`}
                    >
                      <div className="flex items-start gap-4">

                        {/* Avatar */}
                        <button onClick={() => setEditCustomer(s)} className="shrink-0">
                          <Avatar name={s.customerName}/>
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => setDrawerCustomer(s)}
                              className="font-bold text-base hover:text-blue-600 dark:hover:text-blue-400 transition">
                              {s.customerName}
                            </button>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${risk.bg} ${risk.color}`}>
                              {risk.label}
                            </span>
                          </div>
                          {s.phone && (
                            <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>
                          )}

                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{t.paid}: ${s.paid?.toFixed(2)}</span>
                              <span>{paidPct}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-[#252525] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${paidPct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.04 }}
                                className={`h-full rounded-full ${
                                  paidPct >= 75 ? "bg-green-500" :
                                  paidPct >= 40 ? "bg-amber-500" : "bg-red-500"
                                }`}
                              />
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="mt-3 flex flex-wrap gap-4 text-xs">
                            <div>
                              <span className="text-gray-400">{t.debt}: </span>
                              <span className="font-bold text-orange-500">${s.balance.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">{t.creditLimit}: </span>
                              {editingLimit === s._id ? (
                                <span className="inline-flex items-center gap-1">
                                  <input type="number" value={newLimit}
                                    onChange={e => setNewLimit(e.target.value)}
                                    className="border border-gray-300 dark:border-white/20 rounded px-1.5 py-0.5 w-20 bg-transparent outline-none text-xs"
                                    autoFocus
                                  />
                                  <button onClick={() => updateLimit(s._id)}
                                    className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                                    {t.save}
                                  </button>
                                  <button onClick={() => setEditingLimit(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => { setEditingLimit(s._id); setNewLimit(limit); }}
                                  className="font-semibold hover:text-blue-500 transition inline-flex items-center gap-0.5">
                                  ${limit.toFixed(2)}
                                  <Pencil size={10} className="opacity-40 ms-0.5"/>
                                </button>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-400">{t.available}: </span>
                              <span className={`font-semibold ${available < 0 ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                                ${available.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={() => setSelected(s)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                              bg-green-600 hover:bg-green-700 text-white transition
                              shadow-[0_4px_12px_rgba(34,197,94,0.3)]">
                            <DollarSign size={13}/> {t.receivePayment}
                          </button>
                          <button onClick={() => setDrawerCustomer(s)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                              bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300
                              hover:bg-gray-200 dark:hover:bg-[#333] transition">
                            <History size={13}/> {t.viewHistory}
                          </button>
                          <button onClick={() => setEditCustomer(s)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
                              bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300
                              hover:bg-gray-200 dark:hover:bg-[#333] transition">
                            <Pencil size={13}/> {t.editCustomer}
                          </button>
                        </div>
                      </div>

                      {/* Overdue warning */}
                      {s.balance > limit && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl
                          bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">
                          <AlertCircle size={13}/>
                          <span>{t.debt} exceeds credit limit by ${(s.balance - limit).toFixed(2)}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* ── RIGHT: Recent Payments ── */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-5">
              <RecentPayments/>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selected       && <ReceivePaymentModal sale={selected}      close={() => setSelected(null)}        reload={load}/>}
      {editCustomer   && <EditCustomerModal   sale={editCustomer}  close={() => setEditCustomer(null)}    reload={load}/>}
      {drawerCustomer && <CustomerPaymentsDrawer customer={drawerCustomer} close={() => setDrawerCustomer(null)} reload={load}/>}
    </div>
  );
}