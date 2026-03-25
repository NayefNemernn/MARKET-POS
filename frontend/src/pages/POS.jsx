import { useRefresh } from "../context/RefreshContext";
import { useEffect, useState, useMemo } from "react";
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { useCart } from "../hooks/useCart";
import CheckoutModal from "../components/CheckoutModal";
import Cart from "../components/pos/Cart";
import BarcodeScanner from "../components/pos/BarcodeScanner";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { useCurrency } from "../context/CurrencyContext";
import ExchangeRateBar from "../components/ExchangeRateBar";
import VoiceButton from "../components/common/VoiceButton";
import toast from "react-hot-toast";
import { ShoppingBag, Search } from "lucide-react";

export default function POS({ setPage }) {
  const { tick } = useRefresh();
  // Seed state from cache immediately — no spinner on first render
  const [products, setProducts]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("cached_products") || "[]"); } catch { return []; }
  });
  const [categories, setCategories]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("cached_categories") || "[]"); } catch { return []; }
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch]             = useState("");
  const [openCheckout, setOpenCheckout] = useState(false);
  // Only show spinner when there's truly nothing to show (first ever load)
  const [loading, setLoading]           = useState(() => {
    return !localStorage.getItem("cached_products");
  });

  const { cart, addToCart, increase, decrease, total, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toLBP, formatLBP, formatUSD, displayCurrency } = useCurrency();

  useEffect(() => { load(); }, [tick]);

  const load = async () => {
    // Only show spinner if we have nothing cached yet
    const hasCached = !!localStorage.getItem("cached_products");
    if (!hasCached) setLoading(true);
    try {
      const [p, c] = await Promise.all([getAllProducts(), getCategories()]);
      localStorage.setItem("cached_products",   JSON.stringify(p));
      localStorage.setItem("cached_categories", JSON.stringify(c));
      setProducts(p);
      setCategories(c);
    } catch {
      // Already showing cached data from initial state — nothing to do
      if (!hasCached) toast("📦 Showing cached products", { icon: "💾" });
    } finally {
      setLoading(false);
    }
  };

  const barcodeMap = useMemo(() => {
    const map = {};
    products.forEach(p => { if (p.barcode) map[p.barcode.toString()] = p; });
    return map;
  }, [products]);

  const addProductSafe = (product) => {
    if (!product)            { toast.error(t.productNotFound); return; }
    if (product.stock === 0) { toast.error(t.outOfStock);      return; }
    addToCart(product);
  };

  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      const code = search.trim();
      if (!code) return;
      const product = barcodeMap[code];
      if (product) {
        addProductSafe(product);
        setSearch(""); // clear after successful scan
      } else {
        // try partial name match before giving up
        addProductSafe(product); // will show "not found" toast
        setSearch("");
      }
    }
  };

  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") { clearCart(); toast(t.cartCleared); } };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCat    = selectedCategory === "all" || p.category?._id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  });

  const renderPrice = (price) => {
    if (displayCurrency === "usd")
      return <span className="text-green-600 dark:text-green-400 font-bold text-sm">{formatUSD(price)}</span>;
    if (displayCurrency === "lbp")
      return <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">{formatLBP(toLBP(price))}</span>;
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-green-600 dark:text-green-400 font-bold text-xs">{formatUSD(price)}</span>
        <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">{formatLBP(toLBP(price))}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0b0b0b] text-gray-900 dark:text-white overflow-hidden">

      {/* Invisible hardware barcode scanner listener */}
      <BarcodeScanner barcodeMap={barcodeMap} onScan={addProductSafe} />

      {/* Exchange rate strip */}
      <div className="px-4 pt-2 pb-1 shrink-0">
        <ExchangeRateBar />
      </div>

      <div className="flex flex-1 overflow-hidden gap-3 px-3 pb-3">

        {/* ── LEFT: Products ── */}
        <div className="flex-1 flex flex-col overflow-hidden gap-2 min-w-0">

          {/* Search */}
          <div className="shrink-0 flex items-center gap-2
            bg-white dark:bg-[#141414] rounded-2xl px-4 py-2
            shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff]
            dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchEnter}
              placeholder={t.search}
              className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
            />
            <VoiceButton onResult={text => setSearch(text)} />
          </div>

          {/* Category pills */}
          <div className="shrink-0 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[{ _id: "all", name: t.all }, ...categories].map(c => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0
                  ${selectedCategory === c._id
                    ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                    : "bg-white dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]"
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Loading products…</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-2">
                {filteredProducts.map(p => {
                  const qty = cart.find(i => i.productId === p._id)?.quantity || 0;
                  const out = p.stock === 0;
                  return (
                    <div
                      key={p._id}
                      onClick={() => addProductSafe(p)}
                      className={`relative flex flex-col rounded-2xl overflow-hidden
                        bg-white dark:bg-[#141414]
                        shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff]
                        dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]
                        transition-all duration-200
                        ${!out ? "cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)]" : "opacity-50"}
                        ${qty > 0 ? "ring-2 ring-blue-500/40" : ""}
                      `}
                    >
                      {out && (
                        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {t.out}
                        </div>
                      )}
                      {qty > 0 && (
                        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                          {qty}
                        </div>
                      )}
                      <div className="h-24 bg-gray-100 dark:bg-[#0f0f0f]">
                        <img
                          src={p.image || "/placeholder.png"}
                          className="w-full h-full object-cover"
                          onError={e => e.target.src = "/placeholder.png"}
                        />
                      </div>
                      <div className="p-2.5 flex flex-col gap-1">
                        <p className="text-xs font-semibold truncate leading-tight">{p.name}</p>
                        {renderPrice(p.price)}
                        <p className="text-[10px] text-gray-400">{t.stock}: {p.stock}</p>
                        <div className="flex items-center justify-between mt-1" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button disabled={out} onClick={() => decrease(p._id)}
                              className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#252525] text-sm font-bold flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#333] transition">−</button>
                            <span className="text-xs font-medium w-3 text-center">{qty}</span>
                            <button disabled={out} onClick={() => increase(p._id)}
                              className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center hover:bg-blue-700 transition">+</button>
                          </div>
                          {qty > 0 && (
                            <span className="text-[10px] text-green-500 font-semibold">{formatUSD(p.price * qty)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                    <ShoppingBag size={40} className="mb-3 opacity-30" />
                    <p className="text-sm">No products found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart ── */}
        <Cart
          cart={cart}
          increase={increase}
          decrease={decrease}
          total={total}
          onCheckout={() => setOpenCheckout(true)}
          t={t}
          formatUSD={formatUSD}
          formatLBP={formatLBP}
          toLBP={toLBP}
          displayCurrency={displayCurrency}
        />
      </div>

      {openCheckout && (
        <CheckoutModal cart={cart} total={total} close={() => setOpenCheckout(false)} />
      )}
    </div>
  );
}