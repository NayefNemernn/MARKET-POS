import React, { useEffect, useState, useCallback } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerById } from "../api/customer.api";
import { useCurrency } from "../context/CurrencyContext";
import ReturnModal from "../components/ReturnModal";
import toast from "react-hot-toast";
import {
  Users, Plus, Search, X, Phone, Mail, MapPin,
  Edit2, Trash2, ChevronRight, DollarSign, ShoppingBag,
  AlertCircle, RotateCcw, Eye,
} from "lucide-react";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";

/* ── small form modal ──────────────────────────────────────── */
function CustomerFormModal({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    name:    customer?.name    || "",
    phone:   customer?.phone   || "",
    email:   customer?.email   || "",
    address: customer?.address || "",
    notes:   customer?.notes   || "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      const saved = customer
        ? await updateCustomer(customer._id, form)
        : await createCustomer(form);
      toast.success(customer ? "Customer updated" : "Customer added");
      onSave(saved);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h2 className="font-bold text-base">{customer ? "Edit Customer" : "New Customer"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1c1c1c] flex items-center justify-center hover:bg-gray-200 transition">
            <X size={16}/>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            { key:"name",    label:"Full name *",   placeholder:"Ahmad Khalil",       icon: Users },
            { key:"phone",   label:"Phone",         placeholder:"+961 70 000 000",     icon: Phone },
            { key:"email",   label:"Email",         placeholder:"ahmad@example.com",   icon: Mail  },
            { key:"address", label:"Address",       placeholder:"Beirut, Lebanon",     icon: MapPin},
          ].map(({ key, label, placeholder, icon: Icon }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
              <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-blue-400 outline-none text-sm transition"/>
              </div>
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} placeholder="Any notes about this customer..."
              className="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border-2 border-transparent focus:border-blue-400 outline-none text-sm transition resize-none"/>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 transition">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : null}
            {customer ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── customer detail drawer ────────────────────────────────── */
function CustomerDetail({ customerId, onClose, onReturn }) {
  const { formatUSD } = useCurrency();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnSale, setReturnSale] = useState(null);

  useEffect(() => {
    getCustomerById(customerId)
      .then(setData)
      .catch(() => toast.error("Failed to load customer"))
      .finally(() => setLoading(false));
  }, [customerId]);

  const reload = () => {
    setLoading(true);
    getCustomerById(customerId).then(setData).finally(() => setLoading(false));
  };

  const fmtDate = d => new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });

  const statusBadge = s => ({
    completed:          { cls:"bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",  label:"Paid"    },
    partially_returned: { cls:"bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300", label:"Partial" },
    fully_returned:     { cls:"bg-gray-100  dark:bg-gray-800    text-gray-600  dark:text-gray-400",   label:"Returned"},
  }[s] || { cls:"bg-gray-100 text-gray-600", label: s });

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
        <div className="w-full max-w-lg bg-white dark:bg-[#141414] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="font-bold text-base">Customer Profile</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1c1c1c] flex items-center justify-center hover:bg-gray-200 transition">
              <X size={16}/>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : data ? (
              <>
                {/* Profile header */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xl font-bold">
                    {data.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{data.customer.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {data.customer.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={11}/>{data.customer.phone}</span>}
                      {data.customer.email && <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={11}/>{data.customer.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:"Total Spent",   value: formatUSD(data.customer.totalSpent || 0),   color:"text-green-600 dark:text-green-400" },
                    { label:"Orders",        value: data.customer.totalOrders || 0,             color:"text-blue-600 dark:text-blue-400"  },
                    { label:"Outstanding",   value: formatUSD(data.customer.outstandingBalance || 0), color: data.customer.outstandingBalance > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400" },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Outstanding balance warning */}
                {data.customer.outstandingBalance > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={14}/>
                    Outstanding balance: {formatUSD(data.customer.outstandingBalance)}
                  </div>
                )}

                {/* Purchase history */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Purchase History</p>
                  {data.sales.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">No purchases yet</div>
                  ) : (
                    <div className="space-y-2">
                      {data.sales.map(sale => {
                        const { cls, label } = statusBadge(sale.status);
                        return (
                          <div key={sale._id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{formatUSD(sale.total)}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>
                                {sale.totalRefunded > 0 && (
                                  <span className="text-[10px] text-gray-400">−{formatUSD(sale.totalRefunded)} refunded</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {fmtDate(sale.createdAt)} · {sale.items?.length} item{sale.items?.length !== 1 ? "s" : ""}
                                {sale.paymentMethod === "split" ? " · Split" : ` · ${sale.paymentMethod}`}
                              </p>
                            </div>
                            {sale.status !== "fully_returned" && (
                              <button
                                onClick={() => setReturnSale(sale)}
                                className="shrink-0 p-2 rounded-lg bg-white dark:bg-[#252525] border border-gray-200 dark:border-white/10 hover:bg-gray-100 transition text-gray-500"
                                title="Process return">
                                <RotateCcw size={13}/>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {returnSale && (
        <ReturnModal
          sale={returnSale}
          onClose={() => setReturnSale(null)}
          onSuccess={() => { setReturnSale(null); reload(); }}
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function Customers() {
  const { formatUSD } = useCurrency();
  const [customers, setCustomers]     = useState([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewId, setViewId]           = useState(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try { setCustomers(await getCustomers(q)); }
    catch { toast.error("Failed to load customers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleSave = (saved) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c._id === saved._id);
      return idx >= 0 ? prev.map((c, i) => i === idx ? saved : c) : [saved, ...prev];
    });
    setShowForm(false);
    setEditCustomer(null);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c._id !== id));
      toast.success("Customer removed");
    } catch { toast.error("Failed"); }
  };

  /* stats */
  const totalOutstanding = customers.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
  const totalSpent       = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users size={22} className="text-blue-500"/> Customers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{customers.length} customers</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition">
            <Plus size={16}/> New Customer
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label:"Total Customers",   value: customers.length,       color:"text-blue-600 dark:text-blue-400",  bg:"bg-blue-50 dark:bg-blue-900/20"  },
            { label:"Total Revenue",     value: formatUSD(totalSpent),  color:"text-green-600 dark:text-green-400",bg:"bg-green-50 dark:bg-green-900/20"},
            { label:"Outstanding Debt",  value: formatUSD(totalOutstanding), color: totalOutstanding > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400", bg:"bg-red-50 dark:bg-red-900/20" },
          ].map(k => (
            <div key={k.label} className={`${CARD} p-4 ${k.bg}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className={`${CARD} flex items-center gap-2 px-4 py-2.5`}>
          <Search size={16} className="text-gray-400 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"/>
          {search && <button onClick={() => setSearch("")}><X size={14} className="text-gray-400"/></button>}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : customers.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <Users size={40} className="mx-auto mb-3 opacity-20"/>
            <p className="text-gray-400 text-sm">{search ? "No customers found" : "No customers yet — add your first one"}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {customers.map(c => (
              <div key={c._id} className={`${CARD} p-4 flex items-center gap-3 group`}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-base shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {c.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10}/>{c.phone}</span>}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ShoppingBag size={10}/>{c.totalOrders || 0} orders
                    </span>
                    {c.outstandingBalance > 0 && (
                      <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={10}/>{formatUSD(c.outstandingBalance)} owed
                      </span>
                    )}
                    {c.totalSpent > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <DollarSign size={10}/>{formatUSD(c.totalSpent)} spent
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setViewId(c._id)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1c1c1c] hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center justify-center transition text-gray-500 hover:text-blue-600">
                    <Eye size={13}/>
                  </button>
                  <button onClick={() => { setEditCustomer(c); setShowForm(true); }}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1c1c1c] hover:bg-gray-200 dark:hover:bg-[#252525] flex items-center justify-center transition text-gray-500">
                    <Edit2 size={13}/>
                  </button>
                  <button onClick={() => handleDelete(c._id, c.name)}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1c1c1c] hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition text-gray-500 hover:text-red-500">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <CustomerFormModal
          customer={editCustomer}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditCustomer(null); }}
        />
      )}
      {viewId && (
        <CustomerDetail
          customerId={viewId}
          onClose={() => setViewId(null)}
        />
      )}
    </div>
  );
}