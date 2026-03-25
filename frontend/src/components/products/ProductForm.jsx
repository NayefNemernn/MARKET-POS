import React, { useState } from "react";
import { useProductsTranslation } from "../../hooks/useProductsTranslation";
import { useCurrency } from "../../context/CurrencyContext";
import VoiceButton from "../common/VoiceButton";

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
  const { exchangeRate, formatLBP, toLBP, formatUSD } = useCurrency();

  // Which currency the user is typing the price in
  const [priceCurrency, setPriceCurrency] = useState("usd"); // "usd" | "lbp"

  // The raw value typed into the price field
  const [priceInput, setPriceInput] = useState(form.price || "");

  // When price input changes, convert and store USD in form (backend always gets USD)
  const handlePriceChange = (raw) => {
    setPriceInput(raw);
    const num = parseFloat(raw);
    if (isNaN(num) || raw === "") {
      setForm({ ...form, price: "" });
      return;
    }
    if (priceCurrency === "lbp") {
      // Convert LBP → USD for storage
      setForm({ ...form, price: (num / exchangeRate).toFixed(4) });
    } else {
      setForm({ ...form, price: raw });
    }
  };

  // When currency toggle switches, convert the displayed value
  const switchCurrency = (to) => {
    if (to === priceCurrency) return;
    const current = parseFloat(priceInput);
    if (!isNaN(current) && current > 0) {
      if (to === "lbp") {
        // currently USD → show LBP
        setPriceInput(Math.round(current * exchangeRate).toString());
      } else {
        // currently LBP → show USD
        setPriceInput((current / exchangeRate).toFixed(2));
      }
    }
    setPriceCurrency(to);
  };

  // Computed preview of the other currency
  const otherCurrencyPreview = () => {
    const num = parseFloat(priceInput);
    if (isNaN(num) || num <= 0) return null;
    if (priceCurrency === "usd") {
      return `≈ ${formatLBP(toLBP(num))}`;
    } else {
      return `≈ ${formatUSD(num / exchangeRate)}`;
    }
  };

  const inputClass = `
    w-full px-4 py-3 rounded-2xl outline-none text-sm
    bg-gray-100 dark:bg-[#0f0f0f]
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-600
    shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]
    dark:shadow-[inset_4px_4px_8px_#050505,inset_-4px_-4px_8px_#1a1a1a]
    transition-all duration-150
    focus:shadow-[inset_4px_4px_8px_#bfdbfe,inset_-4px_-4px_8px_#ffffff]
    dark:focus:shadow-[inset_4px_4px_8px_#1e3a5f,inset_-4px_-4px_8px_#1a1a1a]
  `;

  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  const fields = [
    {
      key: "name",
      label: t.productName || "Product Name",
      placeholder: "e.g. Coca-Cola 330ml",
      type: "text",
      value: form.name,
      onChange: (v) => setForm({ ...form, name: v }),
      voiceFilter: (t) => t,
    },
    {
      key: "stock",
      label: t.stock || "Stock",
      placeholder: "0",
      type: "number",
      value: form.stock,
      onChange: (v) => setForm({ ...form, stock: v }),
      voiceFilter: (t) => t.replace(/[^0-9]/g, ""),
    },
    {
      key: "category",
      label: t.category || "Category",
      placeholder: "e.g. Beverages",
      type: "text",
      list: "categories",
      value: form.category,
      onChange: (v) => setForm({ ...form, category: v }),
      voiceFilter: (t) => t,
    },
    {
      key: "barcode",
      label: t.barcode || "Barcode",
      placeholder: "Scan or type barcode",
      type: "text",
      value: barcode,
      onChange: (v) => setBarcode(v),
      voiceFilter: (t) => t.replace(/[^0-9]/g, ""),
    },
  ];

  const preview_val = otherCurrencyPreview();

  return (
    <div className="
      bg-gray-100 dark:bg-[#0b0b0b]
      rounded-3xl p-6 space-y-6
      shadow-[10px_10px_25px_#d1d5db,-10px_-10px_25px_#ffffff]
      dark:shadow-[10px_10px_25px_#050505,-10px_-10px_25px_#1f1f1f]
    ">

      {/* TITLE */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-green-500" />
        <h2 className="font-bold text-base tracking-tight">
          {t.addNewProduct || "Add New Product"}
        </h2>
      </div>

      {/* FIELDS GRID — all equal columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* === PRICE FIELD — special with USD/LBP toggle === */}
        <div className="sm:col-span-2 xl:col-span-1">
          <label className={labelClass}>
            {t.price || "Price"}
          </label>

          {/* Currency toggle */}
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => switchCurrency("usd")}
              className={`
                flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all
                ${priceCurrency === "usd"
                  ? "bg-green-500 text-white shadow-[0_2px_8px_rgba(34,197,94,0.4)]"
                  : "bg-gray-200 dark:bg-[#1c1c1c] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }
              `}
            >
              $ USD
            </button>
            <button
              type="button"
              onClick={() => switchCurrency("lbp")}
              className={`
                flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all
                ${priceCurrency === "lbp"
                  ? "bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
                  : "bg-gray-200 dark:bg-[#1c1c1c] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }
              `}
            >
              ل.ل LBP
            </button>
          </div>

          {/* Price input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className={`
                absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none
                ${priceCurrency === "usd" ? "text-green-500" : "text-amber-500"}
              `}>
                {priceCurrency === "usd" ? "$" : "ل"}
              </span>
              <input
                type="number"
                placeholder={priceCurrency === "usd" ? "0.00" : "0"}
                value={priceInput}
                onChange={(e) => handlePriceChange(e.target.value)}
                className={inputClass + " pl-7"}
              />
            </div>
            <VoiceButton
              onResult={(text) => {
                const num = text.replace(/[^0-9.]/g, "");
                if (num) handlePriceChange(num);
              }}
            />
          </div>

          {/* Live conversion preview */}
          {preview_val && (
            <p className={`text-xs mt-1.5 px-1 font-medium ${priceCurrency === "usd" ? "text-amber-500" : "text-green-500"}`}>
              {preview_val}
            </p>
          )}
        </div>

        {/* === ALL OTHER FIELDS === */}
        {fields.map((field) => (
          <div key={field.key}>
            <label className={labelClass}>{field.label}</label>
            <div className="flex items-center gap-2">
              <input
                type={field.type}
                list={field.list}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className={inputClass}
              />
              <VoiceButton
                onResult={(text) => {
                  const filtered = field.voiceFilter(text);
                  if (filtered) field.onChange(filtered);
                }}
              />
            </div>
          </div>
        ))}

      </div>

      {/* CATEGORY DATALIST */}
      <datalist id="categories">
        {categories.map(c => (
          <option key={c._id} value={c.name} />
        ))}
      </datalist>

      {/* IMAGE DROPZONE */}
      <ImageDropzone
        preview={preview}
        setPreview={setPreview}
        setImage={setImage}
      />

      {/* IMAGE PREVIEW */}
      {preview && (
        <div className="
          h-44 rounded-2xl overflow-hidden
          bg-gray-100 dark:bg-[#141414]
          shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]
          dark:shadow-[inset_4px_4px_8px_#050505,inset_-4px_-4px_8px_#1a1a1a]
          flex items-center justify-center
        ">
          <img src={preview} className="h-40 object-contain rounded-xl" />
        </div>
      )}

      {/* ADD BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={onCreate}
          className="
            flex items-center gap-2
            px-7 py-2.5 rounded-full
            bg-green-600 hover:bg-green-700
            text-white font-semibold text-sm
            shadow-[0_4px_14px_rgba(34,197,94,0.35)]
            hover:shadow-[0_4px_20px_rgba(34,197,94,0.5)]
            transition-all duration-200
            hover:scale-[1.03]
          "
        >
          <span className="text-lg leading-none">+</span>
          {t.addProduct || "Add Product"}
        </button>
      </div>

    </div>
  );
}