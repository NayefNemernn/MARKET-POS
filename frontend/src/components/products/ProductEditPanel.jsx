import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Printer, Tag, Package, TrendingUp, Save, RefreshCw, DollarSign, ShoppingCart, Calendar } from "lucide-react";
import VoiceButton from "../common/VoiceButton";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";
import { useEffect, useRef, useState } from "react";
import { useProductsTranslation } from "../../hooks/useProductsTranslation";
import { getProductStats } from "../../api/product.api";

export default function ProductEditPanel({
  editingProduct,
  setEditingProduct,
  setProducts,
  updateProduct,
  editImage,
  setEditImage,
  editPreview,
  setEditPreview,
}) {
  const t          = useProductsTranslation();
  const barcodeRef = useRef(null);
  const [saving, setSaving]           = useState(false);
  const [stats, setStats]             = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!editingProduct?._id) return;
    setStats(null);
    setLoadingStats(true);
    getProductStats(editingProduct._id)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [editingProduct?._id]);

  useEffect(() => {
    if (!editingProduct?.barcode || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, String(editingProduct.barcode), {
        format: "CODE128", width: 2, height: 50,
        displayValue: true, fontSize: 12, margin: 6,
        background: "transparent", lineColor: "#111111",
      });
    } catch {}
  }, [editingProduct?.barcode]);

  const printLabel = () => {
    if (!editingProduct?.barcode) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);
    JsBarcode(svg, String(editingProduct.barcode), {
      format: "CODE128", width: 3, height: 80,
      displayValue: true, fontSize: 14, margin: 10,
      background: "#ffffff", lineColor: "#000000",
    });
    const svgData = new XMLSerializer().serializeToString(svg);
    document.body.removeChild(svg);
    const svgUrl = URL.createObjectURL(new Blob([svgData], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 3;
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      const win = window.open("", "_blank");
      win.document.write(`<!DOCTYPE html><html><head><title>Label — ${editingProduct.barcode}</title>
        <style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}img{max-width:100%}@media print{@page{margin:10mm}body{min-height:unset}}</style>
        </head><body><img src="${canvas.toDataURL("image/png")}"/>
        <script>window.onload=()=>window.print();<\/script></body></html>`);
      win.document.close();
    };
    img.src = svgUrl;
  };

  const handleSave = async () => {
    if (!editingProduct.name) { toast.error("Product name is required"); return; }
    setSaving(true);
    try {
      const data = new FormData();
      data.append("name",    editingProduct.name);
      data.append("price",   String(editingProduct.price));
      data.append("cost",    String(editingProduct.cost || 0));
      data.append("stock",   String(editingProduct.stock));
      data.append("barcode", editingProduct.barcode);
      if (editingProduct.expiryDate) data.append("expiryDate", editingProduct.expiryDate);
      if (editImage) data.append("image", editImage);
      const updated = await updateProduct(editingProduct._id, data);
      setProducts(prev => prev.map(p => p._id === updated._id ? updated : p));
      setEditingProduct(null);
      setEditImage(null);
      toast.success(t.productUpdated);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl outline-none text-sm transition " +
    "bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/10 " +
    "focus:border-blue-400 dark:focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15";

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="flex-1 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/8 p-3">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon size={12}/>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );

  return (
    <AnimatePresence>
      {editingProduct && (
        <>
          {/* Backdrop — click to close */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingProduct(null)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Right-side drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[400px] max-w-full
              bg-white dark:bg-[#161616]
              border-l border-gray-200 dark:border-white/10
              shadow-[-20px_0_60px_rgba(0,0,0,0.15)]
              flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8 shrink-0">
              <div className="flex items-center gap-3">
                {(editPreview || editingProduct.image) ? (
                  <img
                    src={editPreview || editingProduct.image}
                    className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-white/10"
                    onError={e => e.target.src = "/placeholder.png"}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Package size={16} className="text-blue-600 dark:text-blue-400"/>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-sm">{t.editProduct}</h2>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{editingProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition"
              >
                <X size={15}/>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Image dropzone */}
              <div
                className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer group"
                style={{ height: 120 }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  setEditImage(file);
                  setEditPreview(URL.createObjectURL(file));
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file"; input.accept = "image/*";
                  input.onchange = e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setEditImage(file);
                    setEditPreview(URL.createObjectURL(file));
                  };
                  input.click();
                }}
              >
                {(editPreview || editingProduct.image) ? (
                  <img src={editPreview || editingProduct.image} className="w-full h-full object-cover" onError={e => e.target.src = "/placeholder.png"}/>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-1.5">
                    <Package size={24}/>
                    <p className="text-xs">Click or drag image</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <p className="text-white text-xs font-medium">{t.dragImageReplace}</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.productName}</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className={inp + " flex-1"}
                  />
                  <VoiceButton onResult={text => setEditingProduct({ ...editingProduct, name: text })} color="blue"/>
                </div>
              </div>

              {/* Price + Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.price} ($)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" min="0" step="0.01" value={editingProduct.price}
                      onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className={inp + " flex-1"}/>
                    <VoiceButton onResult={text => { const n = text.replace(/[^0-9.]/g,""); if(n) setEditingProduct({ ...editingProduct, price: Number(n) }); }} color="green"/>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.cost || "Cost"} ($)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" min="0" step="0.01" value={editingProduct.cost || ""} placeholder="0.00"
                      onChange={e => setEditingProduct({ ...editingProduct, cost: Number(e.target.value) })}
                      className={inp + " flex-1"}/>
                    <VoiceButton onResult={text => { const n = text.replace(/[^0-9.]/g,""); if(n) setEditingProduct({ ...editingProduct, cost: Number(n) }); }} color="green"/>
                  </div>
                </div>
              </div>

              {/* Margin pill */}
              {editingProduct.price > 0 && editingProduct.cost > 0 && (() => {
                const margin = ((editingProduct.price - editingProduct.cost) / editingProduct.price * 100);
                const profit = editingProduct.price - editingProduct.cost;
                const color  = margin >= 20 ? "text-green-600 dark:text-green-400" : margin >= 5 ? "text-amber-500" : "text-red-500";
                return (
                  <div className={`text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/8 flex justify-between ${color}`}>
                    <span>Margin <b>{margin.toFixed(1)}%</b></span>
                    <span>Profit/unit <b>${profit.toFixed(2)}</b></span>
                  </div>
                );
              })()}

              {/* Stock */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.stock}</label>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setEditingProduct({ ...editingProduct, stock: Math.max(0, editingProduct.stock - 1) })}
                    className="w-9 h-10 shrink-0 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/15 transition">
                    <Minus size={13}/>
                  </button>
                  <input type="number" min="0" value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className={inp + " text-center"}/>
                  <VoiceButton onResult={text => { const n = text.replace(/[^0-9]/g,""); if(n) setEditingProduct({ ...editingProduct, stock: Number(n) }); }} color="green"/>
                  <button onClick={() => setEditingProduct({ ...editingProduct, stock: editingProduct.stock + 1 })}
                    className="w-9 h-10 shrink-0 rounded-xl bg-gray-100 dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/15 transition">
                    <Plus size={13}/>
                  </button>
                </div>
              </div>

              {/* Expiry date */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={11}/> {t.expiryDate || "Expiry Date"} <span className="normal-case text-gray-300 dark:text-gray-600 font-normal">(optional)</span>
                </label>
                <input type="date"
                  value={editingProduct.expiryDate ? editingProduct.expiryDate.slice(0, 10) : ""}
                  onChange={e => setEditingProduct({ ...editingProduct, expiryDate: e.target.value || null })}
                  min={new Date().toISOString().slice(0, 10)}
                  className={inp + " mt-1"}/>
                {editingProduct.expiryDate && (() => {
                  const days = Math.ceil((new Date(editingProduct.expiryDate) - new Date()) / 86400000);
                  const color = days < 0 ? "text-red-500" : days <= 7 ? "text-red-500" : days <= 30 ? "text-amber-500" : "text-green-500";
                  const msg   = days < 0 ? "Expired!" : days === 0 ? "Expires today!" : `Expires in ${days} day${days !== 1 ? "s" : ""}`;
                  return <p className={`text-xs mt-1 font-medium ${color}`}>{msg}</p>;
                })()}
              </div>

              {/* Barcode */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.barcode}</label>
                <div className="flex gap-2 mt-1">
                  <input value={editingProduct.barcode}
                    onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className={inp + " flex-1"}/>
                  <button onClick={() => setEditingProduct({ ...editingProduct, barcode: Date.now().toString() })}
                    className="px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 text-xs font-medium shrink-0">
                    <RefreshCw size={11}/> {t.generate}
                  </button>
                </div>
              </div>

              {/* Barcode preview */}
              <div className="rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-100 dark:border-white/8 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-gray-400"/>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Preview</span>
                  </div>
                  <button onClick={printLabel}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-medium transition">
                    <Printer size={11}/> {t.printLabel}
                  </button>
                </div>
                <svg ref={barcodeRef} className="w-full"/>
              </div>

              {/* Sales stats */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-gray-400"/>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.salesStatistics}</span>
                </div>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                  </div>
                ) : stats ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-400 font-medium">All time</p>
                    <div className="flex gap-2">
                      <StatCard icon={ShoppingCart} label="Units sold" value={stats.allTime.sold}
                        color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"/>
                      <StatCard icon={DollarSign} label="Revenue" value={`$${stats.allTime.revenue.toFixed(2)}`}
                        color="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"/>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">{t.last30Days}</p>
                    <div className="flex gap-2">
                      <StatCard icon={ShoppingCart} label="Units sold" value={stats.last30.sold}
                        color="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"/>
                      <StatCard icon={DollarSign} label="Revenue" value={`$${stats.last30.revenue.toFixed(2)}`}
                        color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"/>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-400">No sales data yet</div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-white/8 flex gap-3 shrink-0 bg-gray-50 dark:bg-[#111]">
              <button onClick={() => setEditingProduct(null)}
                className="flex-1 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-sm font-medium transition">
                {t.cancel}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  : <Save size={14}/>}
                {t.saveChanges}
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}