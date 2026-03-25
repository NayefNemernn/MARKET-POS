export default function CartItem({ item, onIncrease, onDecrease, formatUSD, formatLBP, toLBP, displayCurrency }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl
      bg-gray-50 dark:bg-[#1c1c1c]
      border border-gray-100 dark:border-white/5">

      {/* Name + unit price */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{item.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {displayCurrency === "lbp"
            ? formatLBP(toLBP(item.price))
            : displayCurrency === "usd"
            ? formatUSD(item.price)
            : `${formatUSD(item.price)} · ${formatLBP(toLBP(item.price))}`}
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDecrease(item.productId)}
          className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#333] text-xs font-bold
            flex items-center justify-center hover:bg-gray-300 transition"
        >−</button>
        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
        <button
          onClick={() => onIncrease(item.productId)}
          className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold
            flex items-center justify-center hover:bg-blue-700 transition"
        >+</button>
      </div>

      {/* Line total */}
      <div className="text-right shrink-0 min-w-[52px]">
        <div className="text-xs font-bold text-green-500">
          {formatUSD(item.price * item.quantity)}
        </div>
        {displayCurrency !== "usd" && (
          <div className="text-[10px] text-amber-500">
            {formatLBP(toLBP(item.price * item.quantity))}
          </div>
        )}
      </div>
    </div>
  );
}