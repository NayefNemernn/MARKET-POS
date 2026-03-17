import React from "react";
import { motion } from "framer-motion";

export default function ProductCard({ product, onDelete, onEdit }) {

  const lowStock = product.stock <= 3;

  return (

    <motion.div
      layout
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onEdit(product)}
      className="
      p-4 space-y-3 cursor-pointer
      
      rounded-3xl
      bg-gray-100 dark:bg-[#141414]

      shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
      dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
      "
    >

      {/* IMAGE AREA */}

      <div
        className="
        h-32 rounded-2xl
        bg-gray-200 dark:bg-[#0f0f0f]

        flex items-center justify-center
        overflow-hidden
        "
      >

        <img
  src={product.image || "/placeholder.png"}
  className="
  w-full
  h-full
  object-cover
  "
/>

      </div>


      {/* PRODUCT NAME */}

      <h3 className="font-semibold text-gray-800 dark:text-gray-100">

        {product.name}

      </h3>


      {/* PRICE */}

      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">

        ${product.price}

      </p>


      {/* BARCODE */}

      <p className="text-sm text-gray-500 dark:text-gray-400">

        Barcode: {product.barcode}

      </p>


      {/* FOOTER */}

      <div className="flex items-center justify-between">

        {/* STOCK */}

        <span
          className={`
          text-xs px-3 py-1 rounded-full font-medium
          ${
            lowStock
              ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
              : "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
          }
          `}
        >
          Stock: {product.stock}
        </span>


        {/* DELETE */}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(product._id);
          }}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Delete
        </button>

      </div>

    </motion.div>

  );

}