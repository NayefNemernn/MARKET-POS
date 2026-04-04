import React, { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Truck, Plus, Trash2, RefreshCw, ShoppingBag, Package } from "lucide-react";

const CARD = "rounded-2xl bg-white dark:bg-[#141414] shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff] dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("suppliers");
  const [showSupForm,   setShowSupForm]   = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [supForm,   setSupForm]   = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [orderForm, setOrderForm] = useState({ supplierId: "", supplierName: "", notes: "", items: [] });
  const [orderItem, setOrderItem] = useState({ productId: "", quantity: 1, costPerUnit: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [s, o, p] = await Promise.all([api.get("/suppliers"), api.get("/suppliers/orders"), api.get("/products")]);
      setSuppliers(s.data); setOrders(o.data); setProducts(p.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try { await api.post("/suppliers", supForm); toast.success("Supplier added"); setShowSupForm(false); setSupForm({ name: "", phone: "", email: "", address: "", notes: "" }); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDeleteSupplier = async (id) => {
    if (!confirm("Delete this supplier?")) return;
    try { await api.delete(`/suppliers/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const addOrderItem = () => {
    if (!orderItem.productId || !orderItem.quantity || !orderItem.costPerUnit) return toast.error("Fill all item fields");
    const product = products.find(p => p._id === orderItem.productId);
    setOrderForm(f => ({ ...f, items: [...f.items, { ...orderItem, productName: product?.name, quantity: +orderItem.quantity, costPerUnit: +orderItem.costPerUnit }] }));
    setOrderItem({ productId: "", quantity: 1, costPerUnit: "" });
  };

  const removeOrderItem = (i) => setOrderForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.items.length) return toast.error("Add at least one item");
    try {
      await api.post("/suppliers/orders", orderForm);
      toast.success("Purchase order created — stock updated");
      setShowOrderForm(false);
      setOrderForm({ supplierId: "", supplierName: "", notes: "", items: [] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm("Delete this order? (Stock will NOT be reversed)")) return;
    try { await api.delete(`/suppliers/orders/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const orderTotal = orderForm.items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950 p-5">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Truck size={20} className="text-white"/></div>
            <div><h1 className="text-xl font-bold">Suppliers & Purchases</h1><p className="text-xs text-gray-500">Manage suppliers and incoming stock</p></div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition"><RefreshCw size={13}/></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-white/10 w-fit">
          {[["suppliers", "Suppliers"], ["orders", "Purchase Orders"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* SUPPLIERS TAB */}
        {tab === "suppliers" && (
          <div className="space-y-4">
            <button onClick={() => setShowSupForm(!showSupForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition"><Plus size={14}/> Add Supplier</button>

            {showSupForm && (
              <form onSubmit={handleCreateSupplier} className={`${CARD} p-5 space-y-3`}>
                <h3 className="font-semibold">New Supplier</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[{ label: "Name *", key: "name", req: true }, { label: "Phone", key: "phone" }, { label: "Email", key: "email" }, { label: "Address", key: "address" }, { label: "Notes", key: "notes" }].map(f => (
                    <div key={f.key} className={f.key === "address" || f.key === "notes" ? "col-span-2 md:col-span-1" : ""}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                      <input required={!!f.req} placeholder={f.label} value={supForm[f.key]} onChange={e => setSupForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none focus:ring-2 focus:ring-indigo-400"/>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm">Save</button>
                  <button type="button" onClick={() => setShowSupForm(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className={`${CARD} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500">
                  <tr>{["Name", "Phone", "Email", "Address", "Notes", ""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-xs">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {suppliers.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{s.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.email || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.address || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{s.notes || "—"}</td>
                      <td className="px-4 py-3"><button onClick={() => handleDeleteSupplier(s._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No suppliers yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PURCHASE ORDERS TAB */}
        {tab === "orders" && (
          <div className="space-y-4">
            <button onClick={() => setShowOrderForm(!showOrderForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition"><Plus size={14}/> New Purchase Order</button>

            {showOrderForm && (
              <div className={`${CARD} p-5 space-y-4`}>
                <h3 className="font-semibold">New Purchase Order</h3>
                <p className="text-xs text-gray-500">Stock will be automatically added to each product when saved.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
                    <select value={orderForm.supplierId} onChange={e => { const s = suppliers.find(x => x._id === e.target.value); setOrderForm(f => ({ ...f, supplierId: e.target.value, supplierName: s?.name || "" })); }} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none">
                      <option value="">No supplier / manual</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <input placeholder="Optional notes" value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none"/>
                  </div>
                </div>

                {/* Add item */}
                <div className="border dark:border-white/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Item</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                      <select value={orderItem.productId} onChange={e => setOrderItem(f => ({ ...f, productId: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none">
                        <option value="">Select product</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                      <input type="number" min="1" value={orderItem.quantity} onChange={e => setOrderItem(f => ({ ...f, quantity: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Cost per unit ($)</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={orderItem.costPerUnit} onChange={e => setOrderItem(f => ({ ...f, costPerUnit: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:border-white/10 outline-none"/>
                    </div>
                  </div>
                  <button type="button" onClick={addOrderItem} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-200 transition"><Plus size={13}/> Add Item</button>
                </div>

                {/* Items list */}
                {orderForm.items.length > 0 && (
                  <div className="space-y-2">
                    {orderForm.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-sm">
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-gray-500">{item.quantity} × ${item.costPerUnit}</span>
                        <span className="font-bold text-indigo-600">${(item.quantity * item.costPerUnit).toFixed(2)}</span>
                        <button onClick={() => removeOrderItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={13}/></button>
                      </div>
                    ))}
                    <div className="flex justify-end px-4 py-2 font-bold text-lg text-indigo-600">Total: ${orderTotal.toFixed(2)}</div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleCreateOrder} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm">Save & Update Stock</button>
                  <button onClick={() => { setShowOrderForm(false); setOrderForm({ supplierId: "", supplierName: "", notes: "", items: [] }); }} className="px-6 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm">Cancel</button>
                </div>
              </div>
            )}

            <div className={`${CARD} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500">
                  <tr>{["Supplier", "Items", "Total Cost", "Received", "By", "Notes", ""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-xs">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{o.supplierName || "Manual"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{o.items?.length} items</td>
                      <td className="px-4 py-3 font-bold text-indigo-600">${o.totalCost?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.receivedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{o.username}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{o.notes || "—"}</td>
                      <td className="px-4 py-3"><button onClick={() => handleDeleteOrder(o._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No purchase orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}