import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useProductsTranslation } from "../../hooks/useProductsTranslation";

const LOW_STOCK_THRESHOLD = 5;

export default function ProductCard({ product, onDelete, onEdit, selected, onToggleSelect }) {
  const t = useProductsTranslation();
  const lowStock = product.stock <= LOW_STOCK_THRESHOLD;

  return (
    <motion.div
      layout
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onEdit(product)}
      className="
        relative p-4 space-y-3 cursor-pointer
        rounded-3xl
        bg-gray-100 dark:bg-[#141414]
        shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
        dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
      "
    >
      {/* Bulk-select checkbox */}
      <div
        className="absolute top-2 left-2 z-10"
        onClick={e => { e.stopPropagation(); onToggleSelect?.(product._id); }}
      >
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
          ${selected
            ? "bg-blue-600 border-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            : "bg-white/80 dark:bg-black/60 border-gray-300 dark:border-white/30 hover:border-blue-400"
          }`}>
          {selected && <Check size={11} className="text-white" strokeWidth={3}/>}
        </div>
      </div>

      {/* IMAGE */}
      <div className="h-32 rounded-2xl bg-gray-200 dark:bg-[#0f0f0f] flex items-center justify-center overflow-hidden">
        <img
          src={product.image || "/placeholder.png"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* NAME */}
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
        {product.name}
      </h3>

      {/* PRICE */}
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        ${product.price}
      </p>

      {/* BARCODE */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t.barcodeLabel}: {product.barcode}
      </p>

      {/* FOOTER */}
      <div className="flex items-center justify-between">
        <span className={`
          text-xs px-3 py-1 rounded-full font-medium
          ${lowStock
            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
            : "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
          }
        `}>
          {t.stockLabel}: {product.stock}
        </span>

        <button
          onClick={e => { e.stopPropagation(); onDelete(product._id); }}
          className="text-sm text-red-500 hover:text-red-700"
        >
          {t.delete}
        </button>
      </div>
    </motion.div>
  );
}
