import { useRefresh } from "../context/RefreshContext";
import { useEffect, useState, useMemo } from "react";
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { useCart } from "../hooks/useCart";
import CheckoutModal from "../components/CheckoutModal";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { useCurrency } from "../context/CurrencyContext";
import ExchangeRateBar from "../components/ExchangeRateBar";
import VoiceButton from "../components/common/VoiceButton";
import toast from "react-hot-toast";
import { ShoppingBag, Search } from "lucide-react";

export default function POS({ setPage }) {
  const { tick } = useRefresh();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [openCheckout, setOpenCheckout] = useState(false);

  const { cart, addToCart, increase, decrease, total, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toLBP, formatLBP, formatUSD, displayCurrency } = useCurrency();

  useEffect(() => { load(); }, [tick]);

  const load = async () => {
    try {
      const [p, c] = await Promise.all([getAllProducts(), getCategories()]);
      localStorage.setItem("cached_products", JSON.stringify(p));
      localStorage.setItem("cached_categories", JSON.stringify(c));
      setProducts(p);
      setCategories(c);
    } catch {
      const cached = localStorage.getItem("cached_products");
      const cachedCats = localStorage.getItem("cached_categories");
      if (cached) setProducts(JSON.parse(cached));
      if (cachedCats) setCategories(JSON.parse(cachedCats));
      if (cached) toast("📦 Showing cached products", { icon: "💾" });
    }
  };

  const barcodeMap = useMemo(() => {
    const map = {};
    products.forEach(p => { if (p.barcode) map[p.barcode.toString()] = p; });
    return map;
  }, [products]);

  const addProductSafe = (product) => {
    if (!product) { toast.error(t.productNotFound); return; }
    if (product.stock === 0) { toast.error(t.outOfStock); return; }
    addToCart(product);
  };

  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      const code = search.trim();
      const product = barcodeMap[code];
      addProductSafe(product);
      setSearch("");
    }
  };

  // Hardware barcode scanner
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;
    const handleScanner = (e) => {
      if (e.target.tagName === "INPUT") return;
      const now = Date.now();
      if (now - lastKeyTime > 100) buffer = "";
      lastKeyTime = now;
      if (e.key === "Enter") {
        const product = barcodeMap[buffer.trim()];
        if (product) addProductSafe(product);
        buffer = "";
        return;
      }
      if (/^[0-9a-zA-Z]$/.test(e.key)) buffer += e.key;
    };
    window.addEventListener("keydown", handleScanner);
    return () => window.removeEventListener("keydown", handleScanner);
  }, [barcodeMap]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") { clearCart(); toast(t.cartCleared); }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === "all" || p.category?._id === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  });

  const renderPrice = (price) => {
    if (displayCurrency === "usd") return <span className="text-green-600 dark:text-green-400 font-bold text-sm">{formatUSD(price)}</span>;
    if (displayCurrency === "lbp") return <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">{formatLBP(toLBP(price))}</span>;
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-green-600 dark:text-green-400 font-bold text-xs">{formatUSD(price)}</span>
        <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">{formatLBP(toLBP(price))}</span>
      </div>
    );
  };

  const renderCartPrice = (price) => {
    if (displayCurrency === "lbp") return formatLBP(toLBP(price));
    if (displayCurrency === "usd") return formatUSD(price);
    return `${formatUSD(price)} · ${formatLBP(toLBP(price))}`;
  };

  const renderTotal = () => {
    if (displayCurrency === "lbp") return <span className="font-bold text-lg text-amber-500">{formatLBP(toLBP(total))}</span>;
    if (displayCurrency === "usd") return <span className="font-bold text-lg text-green-500">{formatUSD(total)}</span>;
    return (
      <div className="text-right">
        <div className="font-bold text-green-500">{formatUSD(total)}</div>
        <div className="text-xs text-amber-500">{formatLBP(toLBP(total))}</div>
      </div>
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0b0b0b] text-gray-900 dark:text-white overflow-hidden">

      {/* Exchange rate strip */}
      <div className="px-4 pt-2 pb-1 shrink-0">
        <ExchangeRateBar />
      </div>

      <div className="flex flex-1 overflow-hidden gap-3 px-3 pb-3">

        {/* ── LEFT: Products ── */}
        <div className="flex-1 flex flex-col overflow-hidden gap-2 min-w-0">

          {/* Search bar */}
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

          {/* Categories */}
          <div className="shrink-0 flex gap-2 overflow-x-auto pb-1
            scrollbar-none">
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
                    {/* Out of stock badge */}
                    {out && (
                      <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {t.out}
                      </div>
                    )}

                    {/* Qty badge */}
                    {qty > 0 && (
                      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                        {qty}
                      </div>
                    )}

                    {/* Image */}
                    <div className="h-24 bg-gray-100 dark:bg-[#0f0f0f]">
                      <img
                        src={p.image || "/placeholder.png"}
                        className="w-full h-full object-cover"
                        onError={e => e.target.src = "/placeholder.png"}
                      />
                    </div>

                    {/* Info */}
                    <div className="p-2.5 flex flex-col gap-1">
                      <p className="text-xs font-semibold truncate leading-tight">{p.name}</p>
                      {renderPrice(p.price)}
                      <p className="text-[10px] text-gray-400">{t.stock}: {p.stock}</p>

                      {/* +/- controls */}
                      <div className="flex items-center justify-between mt-1" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={out}
                            onClick={() => decrease(p._id)}
                            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#252525] text-sm font-bold flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#333] transition"
                          >−</button>
                          <span className="text-xs font-medium w-3 text-center">{qty}</span>
                          <button
                            disabled={out}
                            onClick={() => increase(p._id)}
                            className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center hover:bg-blue-700 transition"
                          >+</button>
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
          </div>
        </div>

        {/* ── RIGHT: Cart ── */}
        <div className="w-72 xl:w-80 flex flex-col shrink-0
          bg-white dark:bg-[#141414] rounded-2xl
          shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff]
          dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]
          overflow-hidden">

          {/* Cart header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-blue-500" />
              <span className="font-semibold text-sm">{t.currentOrder}</span>
            </div>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                <ShoppingBag size={32} className="opacity-20 mb-2" />
                <p className="text-xs">{t.cartEmpty}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId}
                  className="flex items-center gap-2 p-2.5 rounded-xl
                    bg-gray-50 dark:bg-[#1c1c1c]
                    border border-gray-100 dark:border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{renderCartPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => decrease(item.productId)}
                      className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#333] text-xs font-bold flex items-center justify-center hover:bg-gray-300 transition"
                    >−</button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => increase(item.productId)}
                      className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center hover:bg-blue-700 transition"
                    >+</button>
                  </div>
                  <div className="text-right shrink-0 min-w-[48px]">
                    <div className="text-xs font-bold text-green-500">{formatUSD(item.price * item.quantity)}</div>
                    {displayCurrency !== "usd" && (
                      <div className="text-[10px] text-amber-500">{formatLBP(toLBP(item.price * item.quantity))}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart footer */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{t.total}</span>
              {renderTotal()}
            </div>
            <button
              onClick={() => setOpenCheckout(true)}
              disabled={cart.length === 0}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40
                text-white font-semibold text-sm transition-all
                shadow-[0_4px_14px_rgba(34,197,94,0.4)]"
            >
              {t.checkout}
            </button>
          </div>
        </div>
      </div>

      {openCheckout && (
        <CheckoutModal cart={cart} total={total} close={() => setOpenCheckout(false)} />
      )}
    </div>
  );
}