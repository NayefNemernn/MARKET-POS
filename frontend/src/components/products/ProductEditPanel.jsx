import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Printer } from "lucide-react";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";
import { useEffect } from "react";

import { useProductsTranslation } from "../../hooks/useProductsTranslation";

export default function ProductEditPanel({
  editingProduct,
  setEditingProduct,
  setProducts,
  updateProduct,
  editImage,
  setEditImage,
  editPreview,
  setEditPreview
}) {

  const t = useProductsTranslation();

  useEffect(() => {

    if (!editingProduct) return;

    setTimeout(() => {

      try {

        JsBarcode("#barcodeEdit", editingProduct.barcode, {
          format: "CODE128",
          width: 2,
          height: 40
        });

      } catch {}

    }, 200);

  }, [editingProduct?.barcode]);

  if (!editingProduct) return null;

  return (

    <AnimatePresence>

      {editingProduct && (

        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          exit={{ opacity:0 }}
        >

          {/* BACKDROP */}

          <div
            onClick={()=>setEditingProduct(null)}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />


          {/* PANEL */}

          <div className="absolute inset-y-0 right-0 flex">

            <motion.div
              initial={{ x:500 }}
              animate={{ x:0 }}
              exit={{ x:500 }}
              transition={{ type:"spring", stiffness:260, damping:30 }}
              className="w-[460px] h-full bg-gray-50 dark:bg-neutral-950 flex flex-col shadow-2xl"
            >

              {/* HEADER */}

              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-neutral-700">

                <h2 className="text-lg font-semibold">
                  {t.editProduct}
                </h2>

                <button
                  onClick={()=>setEditingProduct(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-800"
                >
                  <X size={16}/>
                </button>

              </div>


              {/* CONTENT */}

              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* IMAGE */}

                <div
                  className="
                  rounded-2xl p-6 text-center
                  bg-gray-100 dark:bg-[#141414]

                  shadow-[inset_5px_5px_12px_#d1d5db,inset_-5px_-5px_12px_#ffffff]
                  dark:shadow-[inset_5px_5px_12px_#050505,inset_-5px_-5px_12px_#1f1f1f]
                  "
                  onDragOver={(e)=>e.preventDefault()}
                  onDrop={(e)=>{

                    e.preventDefault();

                    const file = e.dataTransfer.files[0];
                    if(!file) return;

                    setEditImage(file);
                    setEditPreview(URL.createObjectURL(file));

                  }}
                >

                  {editPreview ? (

                    <img
                      src={editPreview}
                      className="h-28 mx-auto object-contain"
                    />

                  ) : (

                    <div className="h-28 flex items-center justify-center text-4xl">
                      📦
                    </div>

                  )}

                  <p className="text-sm text-gray-500 mt-2">
                    {t.dragImageReplace}
                  </p>

                </div>


                {/* PRODUCT NAME */}

                <div>

                  <label className="text-xs text-gray-500">
                    {t.productName}
                  </label>

                  <input
                    value={editingProduct.name}
                    onChange={(e)=>setEditingProduct({
                      ...editingProduct,
                      name:e.target.value
                    })}
                    className="
                    mt-2 w-full px-4 py-3 rounded-2xl outline-none
                    bg-gray-100 dark:bg-[#0f0f0f]

                    shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
                    dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
                    "
                  />

                </div>


                {/* PRICE */}

                <div>

                  <label className="text-xs text-gray-500">
                    {t.price}
                  </label>

                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e)=>setEditingProduct({
                      ...editingProduct,
                      price:Number(e.target.value)
                    })}
                    className="
                    mt-2 w-full px-4 py-3 rounded-2xl outline-none
                    bg-gray-100 dark:bg-[#0f0f0f]

                    shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
                    dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
                    "
                  />

                </div>


                {/* STOCK */}

                <div>

                  <label className="text-xs text-gray-500">
                    {t.stock}
                  </label>

                  <div className="flex gap-3 mt-2 items-center">

                    <button
                      onClick={()=>setEditingProduct({
                        ...editingProduct,
                        stock:Math.max(0,editingProduct.stock-1)
                      })}
                      className="
                      w-10 h-10 rounded-xl
                      bg-gray-100 dark:bg-[#0f0f0f]

                      shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
                      dark:shadow-[5px_5px_10px_#050505,-5px_-5px_10px_#1f1f1f]

                      flex items-center justify-center
                      "
                    >
                      <Minus size={16}/>
                    </button>

                    <input
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e)=>setEditingProduct({
                        ...editingProduct,
                        stock:Number(e.target.value)
                      })}
                      className="
                      flex-1 text-center px-4 py-3 rounded-2xl outline-none
                      bg-gray-100 dark:bg-[#0f0f0f]

                      shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
                      dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]
                      "
                    />

                    <button
                      onClick={()=>setEditingProduct({
                        ...editingProduct,
                        stock:editingProduct.stock+1
                      })}
                      className="
                      w-10 h-10 rounded-xl
                      bg-gray-100 dark:bg-[#0f0f0f]

                      shadow-[5px_5px_10px_#d1d5db,-5px_-5px_10px_#ffffff]
                      dark:shadow-[5px_5px_10px_#050505,-5px_-5px_#1f1f1f]

                      flex items-center justify-center
                      "
                    >
                      <Plus size={16}/>
                    </button>

                  </div>

                </div>


                {/* BARCODE */}

                <div>

                  <label className="text-xs text-gray-500">
                    {t.barcode}
                  </label>

                  <div className="flex gap-3 mt-2">

                    <input
                      value={editingProduct.barcode}
                      onChange={(e)=>setEditingProduct({
                        ...editingProduct,
                        barcode:e.target.value
                      })}
                      className="
                      flex-1 px-4 py-3 rounded-2xl outline-none
                      bg-gray-100 dark:bg-[#0f0f0f]

                      shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
                      dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_#1f1f1f]
                      "
                    />

                    <button
                      onClick={()=>setEditingProduct({
                        ...editingProduct,
                        barcode:Date.now().toString()
                      })}
                      className="px-4 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {t.generate}
                    </button>

                  </div>

                </div>


                {/* BARCODE PREVIEW */}

                <div
                  className="
                  p-6 rounded-2xl text-center
                  bg-gray-100 dark:bg-[#141414]

                  shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
                  dark:shadow-[10px_10px_25px_#050505,-10px_-10px_#1f1f1f]
                  "
                >

                  <svg id="barcodeEdit"></svg>

                  <button
                    onClick={()=>window.print()}
                    className="mt-4 px-5 py-2 rounded-full bg-gray-200 dark:bg-[#1c1c1c] flex items-center gap-2 mx-auto"
                  >
                    <Printer size={16}/>
                    {t.printLabel}
                  </button>

                </div>


                {/* SALES */}

                <div
                  className="
                  p-6 rounded-2xl
                  bg-gray-100 dark:bg-[#141414]

                  shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
                  dark:shadow-[10px_10px_25px_#050505,-10px_-10px_#1f1f1f]
                  "
                >

                  <p className="text-sm text-gray-500">
                    {t.salesStatistics}
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {editingProduct.totalSold || 0} {t.sold}
                  </p>

                  <p className="text-sm text-gray-500">
                    {t.last30Days}
                  </p>

                </div>

              </div>


              {/* FOOTER */}

              <div className="p-6 border-t border-gray-200 dark:border-neutral-700 flex gap-4">

                <button
                  onClick={()=>setEditingProduct(null)}
                  className="flex-1 py-3 rounded-full bg-gray-200 dark:bg-[#1c1c1c]"
                >
                  {t.cancel}
                </button>

                <button
                  onClick={async()=>{

                    const data=new FormData();

                    data.append("name",editingProduct.name);
                    data.append("price",String(editingProduct.price));
                    data.append("stock",String(editingProduct.stock));
                    data.append("barcode",editingProduct.barcode);

                    if(editImage) data.append("image",editImage);

                    const updated=await updateProduct(
                      editingProduct._id,
                      data
                    );

                    setProducts(prev =>
                      prev.map(p =>
                        p._id === updated._id ? updated : p
                      )
                    );

                    setEditingProduct(null);
                    setEditImage(null);

                    toast.success(t.productUpdated);

                  }}
                  className="flex-1 py-3 rounded-full bg-green-600 text-white hover:bg-green-700"
                >
                  {t.saveChanges}
                </button>

              </div>

            </motion.div>

          </div>

        </motion.div>

      )}

    </AnimatePresence>

  );

}