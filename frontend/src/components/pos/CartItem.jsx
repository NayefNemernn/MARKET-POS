export default function CartItem({ item, onIncrease, onDecrease, formatUSD, formatLBP, toLBP, displayCurrency }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl
      bg-gray-50 dark:bg-[#1c1c1c]
      border border-gray-100 dark:border-white/5
      hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors">

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-[#111]">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = "/placeholder.png"; }}
        />
      </div>

      {/* Name + unit price */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate leading-tight">{item.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {displayCurrency === "lbp"
            ? formatLBP(toLBP(item.price))
            : displayCurrency === "usd"
            ? formatUSD(item.price)
            : `${formatUSD(item.price)}`}
          {" "}/ unit
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDecrease(item.productId)}
          className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#333] text-xs font-bold
            flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30
            hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >−</button>
        <span className="text-xs font-bold w-4 text-center tabular-nums">{item.quantity}</span>
        <button
          onClick={() => onIncrease(item.productId)}
          className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold
            flex items-center justify-center hover:bg-blue-700 transition"
        >+</button>
      </div>

      {/* Line total */}
      <div className="text-right shrink-0 min-w-[52px]">
        <div className="text-xs font-bold text-green-500 tabular-nums">
          {formatUSD(item.price * item.quantity)}
        </div>
        {displayCurrency !== "usd" && (
          <div className="text-[10px] text-amber-500 tabular-nums">
            {formatLBP(toLBP(item.price * item.quantity))}
          </div>
        )}
      </div>
    </div>
  );
}
