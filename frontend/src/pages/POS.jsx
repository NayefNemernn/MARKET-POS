import { useRefresh }    from "../context/RefreshContext";
import { useEffect, useState, useMemo } from "react";
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { useCart }       from "../hooks/useCart";
import CheckoutModal     from "../components/CheckoutModal";
import Cart              from "../components/pos/Cart";
import BarcodeScanner    from "../components/pos/BarcodeScanner";
import { useAuth }       from "../context/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { useCurrency }   from "../context/CurrencyContext";
import ExchangeRateBar   from "../components/ExchangeRateBar";
import VoiceButton       from "../components/common/VoiceButton";
import {
  cacheProducts, getCachedProducts,
  cacheCategories, getCachedCategories,
  cacheCustomers,
} from "../lib/offlineDB";
import api from "../api/axios";
import toast             from "react-hot-toast";
import { ShoppingBag, Search, RotateCcw } from "lucide-react";
import QuickReturn from "../components/QuickReturn";

// ── Category emoji map (English + Arabic) ────────────────────────────────────
function getCategoryIcon(name = "") {
  const n = name.toLowerCase();

  // Beverages — مشروبات، عصير، ماء، مياه، سودا
  if (/drink|bev|juice|water|soda/.test(n) ||
      /مشروب|عصير|ماء|مياه|سودا|كولا|نكتار/.test(name))           return "🥤";

  // Snacks — وجبات خفيفة، شيبس، مكسرات، بسكويت
  if (/snack|chip|crisp|nuts|biscuit/.test(n) ||
      /وجبة خفيفة|شيبس|مكسرات|بسكويت|كعك|محمصات/.test(name))     return "🍟";

  // Dairy — ألبان، حليب، جبن، زبادي، قشطة
  if (/dairy|milk|cheese|yogurt|cream/.test(n) ||
      /ألبان|حليب|جبن|جبنة|زبادي|قشطة|زبدة|لبن/.test(name))      return "🧀";

  // Bakery — مخبوزات، خبز، كيك، معجنات
  if (/bak|bread|cake|pastry/.test(n) ||
      /مخبوز|خبز|كيك|معجنات|فطير|توست|كرواسان/.test(name))        return "🍞";

  // Medicine — دواء، صيدلية، صحة
  if (/med|pharma|health/.test(n) ||
      /دواء|أدوية|صيدل|صحة|مسكن|فيتامين/.test(name))              return "💊";

  // Personal care — عناية، صابون، شامبو، جمال
  if (/care|hygiene|soap|shampoo|beauty/.test(n) ||
      /عناية|صابون|شامبو|نظافة|جمال|كريم|مرطب|عطر/.test(name))   return "🧴";

  // Electronics — إلكترونيات، هاتف، تقنية
  if (/electron|tech|phone|cable/.test(n) ||
      /إلكترون|هاتف|جوال|تقنية|كابل|شاحن|سماعة/.test(name))      return "📱";

  // Cleaning — تنظيف، منظفات
  if (/clean|deterg/.test(n) ||
      /تنظيف|منظف|غسيل|جلي|مطهر|كلور/.test(name))                return "🧹";

  // Meat & Protein — لحوم، دجاج، سمك
  if (/meat|chicken|beef|fish|poultry/.test(n) ||
      /لحم|لحوم|دجاج|سمك|فروج|مأكولات بحرية/.test(name))         return "🥩";

  // Fruits & Vegetables — فواكه، خضروات
  if (/fruit|veg|produce/.test(n) ||
      /فاكهة|فواكه|خضار|خضروات/.test(name))                       return "🥦";

  // Frozen — مجمدات
  if (/frozen|ice/.test(n) ||
      /مجمد|مجمدات|ثلج/.test(name))                               return "❄️";

  // Sweets & Chocolate — حلويات، شوكولا
  if (/sweet|candy|choc|sugar/.test(n) ||
      /حلوى|حلويات|شوكولا|سكر|كاندي|مربى/.test(name))            return "🍫";

  // Coffee & Tea — قهوة، شاي
  if (/coffee|tea/.test(n) ||
      /قهوة|شاي|نسكافيه|كابتشينو|نعناع/.test(name))              return "☕";

  // Sauces & Spices — صلصات، توابل، بهارات
  if (/sauce|condiment|spice/.test(n) ||
      /صلصة|توابل|بهارات|كاتشب|خل|ملح/.test(name))               return "🧂";

  // Canned & Preserved — معلبات
  if (/can|tin|preserved|conserv/.test(n) ||
      /معلب|معلبات|مخلل|مربى|محفوظ/.test(name))                  return "🥫";

  // Baby products — منتجات أطفال
  if (/baby|infant|diaper/.test(n) ||
      /أطفال|طفل|حفاض|حفاضات|رضاعة/.test(name))                  return "👶";

  // Cigarettes / Tobacco — تبغ، سجائر
  if (/tobac|cigaret|smoke/.test(n) ||
      /سجائر|تبغ|دخان/.test(name))                                return "🚬";

  return "📦";
}

// ── Subtle dot-grid background ────────────────────────────────────────────────
const dotGrid = {
  backgroundImage: `radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)`,
  backgroundSize: "24px 24px",
};

export default function POS({ setPage }) {
  const { tick } = useRefresh();

  const [products,         setProducts]         = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search,           setSearch]           = useState("");
  const [openCheckout,     setOpenCheckout]     = useState(false);
  const [openReturn,       setOpenReturn]       = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [flashId,          setFlashId]          = useState(null); // add-to-cart animation

  const { cart, addToCart, increase, decrease, clearCart, total } = useCart();
  const { user }   = useAuth();
  const { t }      = useTranslation();
  const { toLBP, formatLBP, formatUSD, displayCurrency } = useCurrency();

  /* ── load products ── */
  const load = async () => {
    const cachedP = await getCachedProducts();
    const cachedC = await getCachedCategories();
    if (cachedP) { setProducts(cachedP); setLoading(false); }
    if (cachedC) setCategories(cachedC);
    try {
      const [p, c, cusRes] = await Promise.all([
        getAllProducts(),
        getCategories(),
        api.get("/customers").catch(() => ({ data: [] })),
      ]);
      // Only update if we actually got data (guard against empty API response)
      if (p && p.length > 0) { setProducts(p); await cacheProducts(p); }
      if (c && c.length > 0) { setCategories(c); await cacheCategories(c); }
      await cacheCustomers(cusRes.data);
    } catch {
      if (!cachedP) toast("📦 No cached products available", { icon: "⚠️" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tick]);

  useEffect(() => {
    const onOnline = () => load();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const barcodeMap = useMemo(() => {
    const map = {};
    products.forEach(p => { if (p.barcode) map[p.barcode.toString()] = p; });
    return map;
  }, [products]);

  const addProductSafe = (product) => {
    if (!product)            { toast.error(t.productNotFound); return; }
    if (product.stock === 0) { toast.error(t.outOfStock);      return; }
    addToCart(product);
    // Brief flash animation
    setFlashId(product._id);
    setTimeout(() => setFlashId(id => id === product._id ? null : id), 300);
  };

  const handleSearchEnter = (e) => {
    if (e.key !== "Enter") return;
    const code = search.trim();
    if (!code) return;
    const product = barcodeMap[code];
    addProductSafe(product);
    setSearch("");
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
      return <span className="text-green-500 dark:text-green-400 font-bold text-sm tabular-nums">{formatUSD(price)}</span>;
    if (displayCurrency === "lbp")
      return <span className="text-amber-500 dark:text-amber-400 font-bold text-xs tabular-nums">{formatLBP(toLBP(price))}</span>;
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-green-500 dark:text-green-400 font-bold text-sm tabular-nums">{formatUSD(price)}</span>
        <span className="text-amber-500 dark:text-amber-400 font-semibold text-[10px] tabular-nums">{formatLBP(toLBP(price))}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0b0b0b] text-gray-900 dark:text-white overflow-hidden">

      <BarcodeScanner barcodeMap={barcodeMap} onScan={addProductSafe} />

      {/* ── Top bar ── */}
      <div className="px-4 pt-2 pb-1 shrink-0 flex items-center gap-2">
        <div className="flex-1"><ExchangeRateBar /></div>
        <button
          onClick={() => setOpenReturn(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
            bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400
            hover:bg-blue-100 dark:hover:bg-blue-900/30 transition shrink-0
            border border-blue-200 dark:border-blue-500/30">
          <RotateCcw size={12}/> {t.returnBtn || "Return"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden gap-3 px-3 pb-3">

        {/* ── LEFT: Products ── */}
        <div className="flex-1 flex flex-col overflow-hidden gap-2 min-w-0">

          {/* ── Search bar ── */}
          <div className="shrink-0 flex items-center gap-2
            bg-white dark:bg-[#141414] rounded-2xl px-4 py-2.5
            shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff]
            dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchEnter}
              placeholder={t.search}
              className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
            />
            {/* Live product count */}
            {!loading && (
              <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block tabular-nums">
                {filteredProducts.length} products
              </span>
            )}
            {/* Scan hint */}
            <span className="hidden md:flex items-center gap-1 text-[10px] text-gray-300 dark:text-gray-600
              border border-gray-200 dark:border-white/10 px-1.5 py-0.5 rounded-md font-mono shrink-0">
              ↵ scan
            </span>
            <VoiceButton onResult={text => setSearch(text)} />
          </div>

          {/* ── Category pills ── */}
          <div className="relative shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[{ _id: "all", name: t.all }, ...categories].map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold
                    whitespace-nowrap transition-all shrink-0
                    ${selectedCategory === c._id
                      ? "bg-blue-600 text-white shadow-[0_0_14px_rgba(59,130,246,0.45)] scale-[1.04]"
                      : "bg-white dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]"
                    }`}
                >
                  <span className="text-sm leading-none">
                    {c._id === "all" ? "🏪" : getCategoryIcon(c.name)}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
            {/* Scroll fade on right */}
            <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none
              bg-gradient-to-l from-gray-50 dark:from-[#0b0b0b] to-transparent"/>
          </div>

          {/* ── Products grid ── */}
          <div className="flex-1 overflow-y-auto rounded-2xl" style={dotGrid}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Loading products…</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-1 pb-2">
                {filteredProducts.map(p => {
                  const qty   = cart.find(i => i.productId === p._id)?.quantity || 0;
                  const out   = p.stock === 0;
                  const flash = flashId === p._id;
                  return (
                    <div
                      key={p._id}
                      onClick={() => addProductSafe(p)}
                      className={`
                        relative flex flex-col rounded-2xl overflow-hidden
                        bg-white dark:bg-[#141414]
                        shadow-[4px_4px_12px_#d1d5db,-4px_-4px_12px_#ffffff]
                        dark:shadow-[4px_4px_12px_#050505,-4px_-4px_12px_#1a1a1a]
                        transition-all duration-200
                        ${out
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:shadow-[0_8px_28px_rgba(59,130,246,0.18)] hover:-translate-y-0.5"
                        }
                        ${flash ? "scale-[1.05] shadow-[0_0_20px_rgba(59,130,246,0.3)]" : ""}
                        ${qty > 0 ? "ring-2 ring-blue-500/50" : ""}
                      `}
                    >
                      {/* Out-of-stock overlay */}
                      {out && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center
                          bg-black/40 backdrop-blur-[1px] rounded-2xl">
                          <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                            {t.out}
                          </span>
                        </div>
                      )}

                      {/* Cart quantity badge */}
                      {qty > 0 && (
                        <div className="absolute top-2 left-2 z-20 min-w-[22px] h-[22px] px-1.5
                          rounded-full bg-blue-600 text-white text-[10px] font-bold
                          flex items-center justify-center shadow-lg shadow-blue-600/40">
                          {qty}
                        </div>
                      )}

                      {/* Image */}
                      <div className="h-32 bg-gray-100 dark:bg-[#0f0f0f] relative overflow-hidden">
                        <img
                          src={p.image || "/placeholder.png"}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={e => e.target.src = "/placeholder.png"}
                        />
                        {/* Category chip over the image */}
                        {p.category?.name && (
                          <span className="absolute bottom-1.5 right-1.5
                            text-[9px] font-semibold px-1.5 py-0.5 rounded-full
                            bg-black/55 text-white backdrop-blur-sm leading-none">
                            {p.category.name}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5 flex flex-col gap-1.5">
                        <p className="text-xs font-semibold truncate leading-tight text-gray-800 dark:text-white">
                          {p.name}
                        </p>

                        {/* Price row */}
                        <div className="flex items-center justify-between">
                          {renderPrice(p.price)}
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full
                            ${p.stock <= 5
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                              : "bg-gray-100 dark:bg-white/5 text-gray-400"
                            }`}>
                            {t.stock}: {p.stock}
                          </span>
                        </div>

                        {/* +/- controls */}
                        <div className="flex items-center justify-between mt-0.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={out}
                              onClick={() => decrease(p._id)}
                              className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#252525]
                                text-sm font-bold flex items-center justify-center
                                hover:bg-red-100 dark:hover:bg-red-900/30
                                hover:text-red-500 transition-colors disabled:opacity-40"
                            >−</button>
                            <span className="text-xs font-bold w-3 text-center tabular-nums">{qty}</span>
                            <button
                              disabled={out}
                              onClick={() => increase(p._id)}
                              className="w-6 h-6 rounded-full bg-blue-600 text-white
                                text-sm font-bold flex items-center justify-center
                                hover:bg-blue-700 transition disabled:opacity-40"
                            >+</button>
                          </div>
                          {qty > 0 && (
                            <span className="text-[10px] text-green-500 font-bold tabular-nums">
                              {formatUSD(p.price * qty)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && !loading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                      <ShoppingBag size={28} className="opacity-40"/>
                    </div>
                    <p className="text-sm font-medium">No products found</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Try a different search or category</p>
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
          clearCart={clearCart}
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
      {openReturn && (
        <QuickReturn
          onClose={() => setOpenReturn(false)}
          storeName={user?.storeName || "Market POS"}
        />
      )}
    </div>
  );
}
