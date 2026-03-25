import { ShoppingBag } from "lucide-react";
import CartItem from "./CartItem";

export default function Cart({
  cart,
  increase,
  decrease,
  total,
  onCheckout,
  t,
  formatUSD,
  formatLBP,
  toLBP,
  displayCurrency,
}) {
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const renderTotal = () => {
    if (displayCurrency === "lbp")
      return <span className="font-bold text-lg text-amber-500">{formatLBP(toLBP(total))}</span>;
    if (displayCurrency === "usd")
      return <span className="font-bold text-lg text-green-500">{formatUSD(total)}</span>;
    return (
      <div className="text-right">
        <div className="font-bold text-green-500">{formatUSD(total)}</div>
        <div className="text-xs text-amber-500">{formatLBP(toLBP(total))}</div>
      </div>
    );
  };

  return (
    <div className="w-72 xl:w-80 flex flex-col shrink-0
      bg-white dark:bg-[#141414] rounded-2xl
      shadow-[6px_6px_16px_#d1d5db,-6px_-6px_16px_#ffffff]
      dark:shadow-[6px_6px_16px_#050505,-6px_-6px_16px_#1a1a1a]
      overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-blue-500" />
          <span className="font-semibold text-sm">{t.currentOrder}</span>
        </div>
        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
          {cartCount} {cartCount === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
            <ShoppingBag size={32} className="opacity-20 mb-2" />
            <p className="text-xs">{t.cartEmpty}</p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onIncrease={increase}
              onDecrease={decrease}
              formatUSD={formatUSD}
              formatLBP={formatLBP}
              toLBP={toLBP}
              displayCurrency={displayCurrency}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{t.total}</span>
          {renderTotal()}
        </div>
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40
            text-white font-semibold text-sm transition-all
            shadow-[0_4px_14px_rgba(34,197,94,0.4)]"
        >
          {t.checkout}
        </button>
      </div>
    </div>
  );
}