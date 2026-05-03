import React from "react";
import { motion } from "framer-motion";
import { Check, Layers } from "lucide-react";
import { useProductsTranslation } from "../../hooks/useProductsTranslation";
import { getCategoryIcon } from "../../lib/categoryIcon";

const LOW_STOCK_THRESHOLD = 5;
const nameHue = (str) => [...(str || "")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);

export default function ProductCard({ product, onDelete, onEdit, onBatches, selected, onToggleSelect }) {
  const t = useProductsTranslation();
  const lowStock = product.stock <= LOW_STOCK_THRESHOLD;

  return (
    <motion.div
      layout
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onEdit(product)}
      className="
        relative p-4 space-y-3 cursor-pointer h-full
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

      {/* IMAGE or initials banner */}
      {product.image ? (
        <div className="h-32 rounded-2xl overflow-hidden">
          <img src={product.image} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-20 rounded-2xl flex items-center justify-center select-none"
          style={{ background: `linear-gradient(135deg, hsl(${nameHue(product.name)},60%,58%), hsl(${(nameHue(product.name)+40)%360},65%,45%))` }}>
          <span className="text-4xl drop-shadow">
            {getCategoryIcon(product.category?.name)}
          </span>
        </div>
      )}

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

        <div className="flex items-center gap-2">
          {onBatches && (
            <button
              onClick={e => { e.stopPropagation(); onBatches(product); }}
              title="View batches"
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
            >
              <Layers size={11}/> Batches
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(product._id); }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            {t.delete}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
