import { useEffect, useState, useRef } from "react";
import { getOrders, acceptOrder, rejectOrder, cancelOrder } from "../api/orders.api";
import { connectSocket, getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  ShoppingBag, CheckCircle2, XCircle, Clock, Truck,
  Package, Eye, RefreshCw, ChevronDown, ChevronUp,
  Phone, MapPin, MessageSquare, Search, X,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:          { label: "Pending",          color: "bg-yellow-100 text-yellow-700 border-yellow-200",  dot: "bg-yellow-400" },
  accepted:         { label: "Accepted",          color: "bg-blue-100 text-blue-700 border-blue-200",        dot: "bg-blue-500"   },
  rejected:         { label: "Rejected",          color: "bg-red-100 text-red-700 border-red-200",           dot: "bg-red-400"    },
  out_for_delivery: { label: "Out for Delivery",  color: "bg-orange-100 text-orange-700 border-orange-200",  dot: "bg-orange-400" },
  pending_payment:  { label: "Pending Payment",   color: "bg-purple-100 text-purple-700 border-purple-200",  dot: "bg-purple-400" },
  completed:        { label: "Completed",         color: "bg-green-100 text-green-700 border-green-200",     dot: "bg-green-500"  },
  cancelled:        { label: "Cancelled",         color: "bg-gray-100 text-gray-500 border-gray-200",        dot: "bg-gray-400"   },
};

const FILTERS = ["all", "pending", "accepted", "out_for_delivery", "completed", "rejected"];

export default function OnlineOrders() {
  const { user, store: ctxStore } = useAuth();
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [selected,    setSelected]    = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectText,  setRejectText]  = useState("");
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelText,  setCancelText]  = useState("");
  const [processing,  setProcessing]  = useState(false);
  const [newCount,    setNewCount]    = useState(0);
  const [search,      setSearch]      = useState("");
  const audioRef = useRef(null);

  const storeId = ctxStore?._id || user?.storeId;

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const { orders: data } = await getOrders(params);
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  // Socket: listen for new orders
  useEffect(() => {
    if (!storeId) return;
    const s = connectSocket(storeId, "admin");

    const onNew = (order) => {
      setNewCount(n => n + 1);
      setOrders(prev => [order, ...prev]);
      toast.success(`🛒 New order: ${order.orderNumber} — $${order.total.toFixed(2)}`, { duration: 5000 });
      // play notification sound
      try { audioRef.current?.play(); } catch {}
    };

    const onStatusChange = ({ orderId, status }) => {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    };

    s.on("new_order",            onNew);
    s.on("order_status_changed", onStatusChange);
    return () => { s.off("new_order", onNew); s.off("order_status_changed", onStatusChange); };
  }, [storeId]);

  const handleAccept = async (orderId) => {
    setProcessing(true);
    try {
      await acceptOrder(orderId);
      toast.success("Order accepted — sent to cashier");
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept");
    } finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(true);
    try {
      await rejectOrder(rejectModal, rejectText);
      toast.success("Order rejected");
      setRejectModal(null);
      setRejectText("");
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally { setProcessing(false); }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setProcessing(true);
    try {
      await cancelOrder(cancelModal, cancelText);
      toast.success("Order cancelled");
      setCancelModal(null);
      setCancelText("");
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    } finally { setProcessing(false); }
  };

  const timeSince = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)  return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  const filtered = orders
    .filter(o => filter === "all" || o.status === filter)
    .filter(o => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q) ||
        o.assignedDriver?.name?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Notification sound */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Online Orders</h1>
          {newCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 animate-pulse">
              {newCount} new
            </span>
          )}
        </div>
        <button onClick={() => { load(); setNewCount(0); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order #, customer, phone, driver..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {FILTERS.map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 capitalize px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${filter === f ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400"}`}>
            {f === "all" ? "All" : STATUS_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isOpen = selected?._id === order._id;
            return (
              <div key={order._id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all ${isOpen ? "border-blue-300 shadow-md" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
                {/* Row */}
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setSelected(isOpen ? null : order)}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot} ${order.status === "pending" ? "animate-pulse" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 dark:text-white">{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {order.customer?.name} · {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800 dark:text-white">${order.total?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{timeSince(order.createdAt)}</p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t dark:border-gray-700 px-4 pb-4 pt-3 space-y-4">
                    {/* Customer */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                        <Phone size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                        <span>{order.customer?.phone}</span>
                      </div>
                      {order.customer?.address && (
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300 sm:col-span-2">
                          <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{order.customer?.address}</span>
                        </div>
                      )}
                      {order.customer?.notes && (
                        <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 sm:col-span-3">
                          <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                          <span>{order.customer?.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{item.name} × {item.quantity}</span>
                          <span className="font-medium text-gray-800 dark:text-white">${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.deliveryFee > 0 && (
                        <div className="flex justify-between text-sm text-gray-500 border-t dark:border-gray-700 pt-1 mt-1">
                          <span>Delivery fee</span>
                          <span>${order.deliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-800 dark:text-white border-t dark:border-gray-700 pt-1 mt-1">
                        <span>Total</span>
                        <span>${order.total?.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {order.status === "pending" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(order._id)}
                          disabled={processing}
                          className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                          <CheckCircle2 size={16} /> Accept
                        </button>
                        <button
                          onClick={() => setRejectModal(order._id)}
                          disabled={processing}
                          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    )}

                    {/* Cancel button — available for any active order */}
                    {!["completed", "cancelled", "rejected"].includes(order.status) && (
                      <button
                        onClick={() => setCancelModal(order._id)}
                        disabled={processing}
                        className="w-full py-2.5 border border-red-300 text-red-500 hover:bg-red-50 font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                        <XCircle size={15} /> Cancel Order
                      </button>
                    )}

                    {order.status === "rejected" && order.rejectionReason && (
                      <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                        Reason: {order.rejectionReason}
                      </p>
                    )}
                    {order.status === "cancelled" && order.rejectionReason && (
                      <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                        Cancelled: {order.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-gray-800 dark:text-white mb-3">Cancel Order</h2>
            <textarea
              value={cancelText}
              onChange={e => setCancelText(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full border dark:border-gray-700 rounded-xl p-3 text-sm resize-none dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setCancelModal(null); setCancelText(""); }}
                className="flex-1 py-2.5 border rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium">
                Back
              </button>
              <button onClick={handleCancel} disabled={processing}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition text-sm disabled:opacity-60">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-gray-800 dark:text-white mb-3">Reject Order</h2>
            <textarea
              value={rejectText}
              onChange={e => setRejectText(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full border dark:border-gray-700 rounded-xl p-3 text-sm resize-none dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 border rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleReject} disabled={processing}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition text-sm disabled:opacity-60">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
