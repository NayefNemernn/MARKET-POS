import { useProductsTranslation } from "../../hooks/useProductsTranslation";
export default function ProductForm({
  form,
  setForm,
  barcode,
  setBarcode,
  categories,
  onCreate,
  preview,
  setPreview,
  setImage,
  ImageDropzone
}) {

  const t = useProductsTranslation();

  return (

    <div
      className="
      bg-gray-100 dark:bg-[#0b0b0b]
      rounded-3xl
      p-6
      space-y-6
      shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
      dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
      "
    >

      {/* TITLE */}

      <h2 className="font-semibold text-lg">
        {t.addNewProduct}
      </h2>


      {/* INPUTS */}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        <input
          placeholder={t.productName}
          value={form.name}
          onChange={(e)=>setForm({...form,name:e.target.value})}
          className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#141414]
          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]"
        />

        <input
          placeholder={t.price}
          type="number"
          value={form.price}
          onChange={(e)=>setForm({...form,price:e.target.value})}
          className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#141414]
          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]"
        />

        <input
          placeholder={t.stock}
          type="number"
          value={form.stock}
          onChange={(e)=>setForm({...form,stock:e.target.value})}
          className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#141414]
          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]"
        />

        <input
          list="categories"
          placeholder={t.category}
          value={form.category}
          onChange={(e)=>setForm({...form,category:e.target.value})}
          className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#141414]
          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]"
        />

        <input
          placeholder={t.barcode}
          value={barcode}
          onChange={(e)=>setBarcode(e.target.value)}
          className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#141414]
          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]"
        />

      </div>


      {/* CATEGORY LIST */}

      <datalist id="categories">
        {categories.map(c=>(
          <option key={c._id} value={c.name}/>
        ))}
      </datalist>


      {/* IMAGE DROPZONE */}

      <ImageDropzone
        preview={preview}
        setPreview={setPreview}
        setImage={setImage}
      />


      {/* PREVIEW AREA */}

      {preview && (

        <div
          className="
          h-44
          rounded-xl
          bg-gray-100 dark:bg-[#141414]

          shadow-[inset_5px_5px_10px_#d1d5db,inset_-5px_-5px_10px_#ffffff]
          dark:shadow-[inset_5px_5px_10px_#050505,inset_-5px_-5px_10px_#1f1f1f]

          flex items-center justify-center
          "
        >

          <img
            src={preview}
            className="h-40 object-contain rounded-lg"
          />

        </div>

      )}


      {/* ADD BUTTON */}

      <button
        onClick={onCreate}
        className="
        px-6 py-2
        rounded-full
        bg-green-600 hover:bg-green-700
        text-white font-medium
        transition
        "
      >
        + {t.addProduct}
      </button>

    </div>

  );

}