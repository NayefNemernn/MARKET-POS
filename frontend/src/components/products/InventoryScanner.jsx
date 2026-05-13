import { useEffect, useRef, useState, useCallback } from "react";
import { Undo2, Package, Hash, CheckCircle2, X, Plus, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

// Extended charset — covers EAN, UPC, Code128, Code39 barcodes
const BARCODE_CHARSET = /^[0-9a-zA-Z\-\.\/\+]$/;
const SCANNER_TIMEOUT = 300; // ms gap threshold between scanner keystrokes

const EMPTY_FORM = { name: "", price: "", cost: "", stock: "", category: "" };

export default function InventoryScanner({
  inventoryMode,
  setInventoryMode,
  products,
  setProducts,
  updateProduct,
  createProduct,
  categories = [],
  onUnknownBarcode,
}) {
  const [mode,       setMode]       = useState("receive"); // "receive" | "count"
  const [qtyPerScan, setQtyPerScan] = useState(1);
  const [sessionLog, setSessionLog] = useState([]);
  const [lastUndo,   setLastUndo]   = useState(null);

  // Quick-add modal
  const [quickAdd,       setQuickAdd]       = useState(null); // scanned barcode string
  const [quickForm,      setQuickForm]      = useState(EMPTY_FORM);
  const [quickSaving,    setQuickSaving]    = useState(false);

  const bufferRef      = useRef("");
  const lastKeyTimeRef = useRef(0);

  // Clear session when mode is turned off
  useEffect(() => {
    if (!inventoryMode) {
      setSessionLog([]);
      setLastUndo(null);
      setQuickAdd(null);
      bufferRef.current = "";
    }
  }, [inventoryMode]);

  // ── Undo last scan ────────────────────────────────────────────────────────
  const handleUndo = useCallback(async () => {
    if (!lastUndo) return;
    try {
      const updated = await updateProduct(lastUndo.productId, { stock: lastUndo.prevStock });
      setProducts(prev => prev.map(p => p._id === updated._id ? updated : p));
      setSessionLog(prev => prev.filter(e => e.id !== lastUndo.logId));
      setLastUndo(null);
      toast.success("Last scan undone");
    } catch {
      toast.error("Failed to undo");
    }
  }, [lastUndo, updateProduct, setProducts]);

  // ── Apply a scan to an existing product ──────────────────────────────────
  const applyScan = useCallback(async (product, code) => {
    const qty       = Math.max(1, parseInt(qtyPerScan) || 1);
    const prevStock = product.stock;
    const newStock  = mode === "count" ? qty : product.stock + qty;
    const logId     = Date.now();

    const updated = await updateProduct(product._id, { stock: newStock });
    setProducts(prev => prev.map(p => p._id === updated._id ? updated : p));

    setLastUndo({ productId: product._id, prevStock, logId });
    setSessionLog(prev => [
      { id: logId, productName: product.name, barcode: code, qty, mode, stockBefore: prevStock, stockAfter: newStock },
      ...prev,
    ]);

    const label = mode === "count"
      ? `${product.name} → set to ${newStock}`
      : `${product.name} +${qty} → ${newStock}`;
    toast.success(`✅ ${label}`);
  }, [qtyPerScan, mode, updateProduct, setProducts]);

  // ── Keyboard / scanner listener ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (!inventoryMode) return;

      // Don't intercept keys typed into inputs / textareas / selects
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Don't accumulate barcodes while quick-add modal is open
      if (quickAdd) return;

      const now = Date.now();
      if (now - lastKeyTimeRef.current > SCANNER_TIMEOUT) bufferRef.current = "";
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        if (!code) return;

        const product = products.find(p => p.barcode === code);

        if (!product) {
          if (onUnknownBarcode) {
            onUnknownBarcode(code);
            toast.success(`Barcode "${code}" not found — fill in the form to add it`);
          } else {
            setQuickAdd(code);
            setQuickForm({ ...EMPTY_FORM, stock: String(qtyPerScan) });
          }
          return;
        }

        try {
          await applyScan(product, code);
        } catch {
          toast.error("Failed to update stock");
        }
        return;
      }

      if (BARCODE_CHARSET.test(e.key)) bufferRef.current += e.key;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inventoryMode, products, quickAdd, qtyPerScan, applyScan]);

  // ── Quick-add submit ──────────────────────────────────────────────────────
  const handleQuickAdd = async () => {
    if (!quickForm.name.trim()) { toast.error("Product name is required"); return; }
    setQuickSaving(true);
    try {
      const payload = {
        barcode:  quickAdd,
        name:     quickForm.name.trim(),
        price:    parseFloat(quickForm.price)  || 0,
        cost:     parseFloat(quickForm.cost)   || 0,
        stock:    parseInt(quickForm.stock)    || 0,
        category: quickForm.category || undefined,
      };
      const newProduct = await createProduct(payload);
      setProducts(prev => [newProduct, ...prev]);

      const logId = Date.now();
      setLastUndo({ productId: newProduct._id, prevStock: 0, logId });
      setSessionLog(prev => [
        {
          id: logId,
          productName: newProduct.name,
          barcode: quickAdd,
          qty: newProduct.stock,
          mode: "new",
          stockBefore: 0,
          stockAfter: newProduct.stock,
        },
        ...prev,
      ]);

      toast.success(`✅ ${newProduct.name} added (stock: ${newProduct.stock})`);
      setQuickAdd(null);
      setQuickForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create product");
    } finally {
      setQuickSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!inventoryMode) return null;

  const totalScans = sessionLog.length;
  const totalUnits = sessionLog.reduce((sum, e) => sum + e.qty, 0);

  const modeColor = {
    receive: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    count:   "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    new:     "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  };
  const modeLabel = { receive: (e) => `+${e.qty}`, count: (e) => `= ${e.stockAfter}`, new: () => "NEW" };

  return (
    <>
      {/* ── Scanner panel ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/20 overflow-hidden">

        {/* Control bar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Inventory Scan</span>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-0.5 p-1 bg-white dark:bg-black/20 rounded-xl border border-blue-100 dark:border-blue-500/20">
            {[["receive", "Receive (+)"], ["count", "Count (=)"]].map(([val, label]) => (
              <button key={val} onClick={() => setMode(val)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  mode === val ? "bg-blue-600 text-white shadow-sm" : "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                }`}
              >{label}</button>
            ))}
          </div>

          {/* Qty per scan */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-500 font-medium whitespace-nowrap">
              {mode === "count" ? "Set qty:" : "Units / scan:"}
            </span>
            <input
              type="number" min="1" value={qtyPerScan}
              onChange={e => setQtyPerScan(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 rounded-lg text-sm text-center border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-black/20 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 ml-auto text-xs text-blue-500 font-medium">
            <span className="flex items-center gap-1"><Package size={12}/>{totalScans} scans</span>
            <span className="flex items-center gap-1"><Hash size={12}/>{totalUnits} units</span>
          </div>

          {lastUndo && (
            <button onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
                hover:bg-amber-200 dark:hover:bg-amber-900/50 transition border border-amber-200 dark:border-amber-500/30"
            ><Undo2 size={12}/> Undo</button>
          )}

          <button onClick={() => setInventoryMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
              bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
              hover:bg-red-200 dark:hover:bg-red-900/50 transition border border-red-200 dark:border-red-500/30"
          ><X size={12}/> Stop</button>
        </div>

        {/* Session log */}
        {sessionLog.length > 0 ? (
          <div className="border-t border-blue-100 dark:border-blue-500/20 max-h-56 overflow-y-auto divide-y divide-blue-50 dark:divide-blue-500/10">
            {sessionLog.map((entry, i) => (
              <div key={entry.id}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${i === 0 ? "bg-blue-100/60 dark:bg-blue-900/25" : "bg-white/40 dark:bg-transparent hover:bg-white/60 dark:hover:bg-white/5"}`}
              >
                <CheckCircle2 size={14} className="text-green-500 shrink-0"/>
                <span className="font-medium text-gray-800 dark:text-white flex-1 truncate">{entry.productName}</span>
                <span className="text-xs font-mono text-gray-400 shrink-0">{entry.barcode}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${modeColor[entry.mode]}`}>
                  {modeLabel[entry.mode]?.(entry)}
                </span>
                <span className="text-xs text-gray-400 shrink-0 tabular-nums">{entry.stockBefore} → {entry.stockAfter}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 pb-3 text-xs text-blue-400/80 italic">
            {mode === "receive"
              ? `Scan a barcode — each scan adds ${qtyPerScan} unit(s) to current stock`
              : `Scan a barcode — each scan sets stock exactly to ${qtyPerScan}`}
          </p>
        )}
      </div>

      {/* ── Quick-add modal ───────────────────────────────────────────────── */}
      {quickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400"/>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm text-gray-900 dark:text-white">Product Not Found</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Barcode <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{quickAdd}</span> is not in your inventory.
                  Add it now?
                </p>
              </div>
              <button onClick={() => setQuickAdd(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition shrink-0">
                <X size={18}/>
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-4 space-y-3">

              {/* Barcode (locked) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Barcode</label>
                <input readOnly value={quickAdd}
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"/>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  placeholder="Product name"
                  value={quickForm.name}
                  onChange={e => setQuickForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-white"
                />
              </div>

              {/* Price + Cost */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "price", label: "Price ($)" },
                  { key: "cost",  label: "Cost ($)"  },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={quickForm[key]}
                      onChange={e => setQuickForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-white"
                    />
                  </div>
                ))}
              </div>

              {/* Stock + Category */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Initial Stock</label>
                  <input
                    type="number" min="0" placeholder="0"
                    value={quickForm.stock}
                    onChange={e => setQuickForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Category</label>
                  <select
                    value={quickForm.category}
                    onChange={e => setQuickForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-white"
                  >
                    <option value="">None</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={() => setQuickAdd(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition"
              >Skip</button>
              <button
                onClick={handleQuickAdd}
                disabled={quickSaving || !quickForm.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Plus size={14}/>
                {quickSaving ? "Adding…" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
