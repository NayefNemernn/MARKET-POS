import { useEffect } from "react";
import toast from "react-hot-toast";

export default function InventoryScanner({
  inventoryMode,
  setInventoryMode,
  products,
  setProducts,
  updateProduct
}) {

  useEffect(() => {

    let buffer = "";
    let lastKeyTime = 0;

    const handleScanner = async (e) => {

      if (!inventoryMode) return;

      const now = Date.now();

      if (now - lastKeyTime > 100) buffer = "";

      lastKeyTime = now;

      if (e.key === "Enter") {

        const code = buffer.trim();

        const product = products.find(p => p.barcode === code);

        if (!product) {
          toast.error("Product not found");
          buffer = "";
          return;
        }

        const updated = await updateProduct(product._id, {
          stock: product.stock + 1
        });

        setProducts(prev =>
          prev.map(p =>
            p._id === updated._id ? updated : p
          )
        );

        toast.success(`${product.name} stock +1`);

        buffer = "";
        return;
      }

      if (/^[0-9a-zA-Z]$/.test(e.key)) {
        buffer += e.key;
      }

    };

    window.addEventListener("keydown", handleScanner);

    return () => window.removeEventListener("keydown", handleScanner);

  }, [inventoryMode, products]);



  return (

    <div className="flex items-center gap-3">

      {/* BUTTON */}

      <button
        onClick={() => setInventoryMode(!inventoryMode)}
        className={`
        px-4 py-2 rounded-xl
        text-sm font-medium
        transition

        shadow-[5px_5px_12px_#d1d5db,-5px_-5px_12px_#ffffff]
        dark:shadow-[5px_5px_12px_#050505,-5px_-5px_12px_#1f1f1f]

        ${inventoryMode
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-indigo-600 hover:bg-indigo-700 text-white"}
        `}
      >

        {inventoryMode
          ? "Stop Inventory Scan"
          : "Inventory Scan"}

      </button>


      {/* BANNER */}

      {inventoryMode && (

        <div
          className="
          px-4 py-2 rounded-xl text-sm

          bg-gray-100 dark:bg-[#141414]

          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
          "
        >

          📦 Inventory Scan Mode Active — Scan product barcodes to increase stock

        </div>

      )}

    </div>

  );

}