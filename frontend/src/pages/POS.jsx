import React, { useEffect, useRef, useState } from "react";
import { getAllProducts } from "../api/product.api";
import { getCategories } from "../api/category.api";
import { createSale } from "../api/sale.api";
import { useCart } from "../hooks/useCart";
import useOfflineSales from "../hooks/useOfflineSales";
import Receipt from "./Receipt";
import { createHoldSale, getHoldSaleNames } from "../api/holdSale.api";

export default function POS({ setPage, user }) {
  /* =====================
     STATE
  ===================== */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [lastSale, setLastSale] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [status, setStatus] = useState(
    navigator.onLine ? "ONLINE" : "OFFLINE"
  );

  const { cart, addToCart, clearCart, increase, decrease, total } = useCart();
  const { saveOffline, sync } = useOfflineSales();
  const inputRef = useRef(null);

  /* =====================
     LOAD DATA
  ===================== */
  useEffect(() => {
    getAllProducts().then(setProducts);
    getCategories().then(setCategories);
    getHoldSaleNames().then(setNameSuggestions);
  }, []);

  /* =====================
     ONLINE / OFFLINE
  ===================== */
  useEffect(() => {
    const online = async () => {
      setStatus("SYNCING");
      await sync();
      setStatus("ONLINE");
    };
    const offline = () => setStatus("OFFLINE");

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [sync]);

  /* =====================
     FILTER PRODUCTS
  ===================== */
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (p.category && p.category._id === selectedCategory);

    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));

    return matchesCategory && matchesSearch;
  });

  /* =====================
     TOTALS
  ===================== */
  const TAX_RATE = 0.11;
  const subtotal = total;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;

  const getItemQty = (productId) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  /* =====================
     CHECKOUT
  ===================== */
  const handleCheckout = async (paymentMethod = "cash") => {
    if (cart.length === 0) return;

    const payload = {
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      paymentMethod,
    };

    try {
      const res = await createSale(payload);
      setLastSale(res.sale);
      clearCart();
    } catch (err) {
      if (!navigator.onLine) {
        saveOffline(payload);
        setStatus("OFFLINE");
        clearCart();
      }
    }
  };

  /* =====================
     PAY LATER
  ===================== */
  const handlePayLater = async () => {
    if (!customerName.trim()) {
      alert("Enter customer name");
      return;
    }

    const payload = {
      customerName,
      items: cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total,
    };

    await createHoldSale(payload);

    clearCart();
    setCustomerName("");
    setShowSuggestions(false);
    alert("Saved for Pay Later");
  };

  /* =====================
     RECEIPT
  ===================== */
  if (lastSale) {
    return (
      <Receipt
        sale={lastSale}
        onClose={() => setLastSale(null)}
      />
    );
  }

  /* =====================
     UI
  ===================== */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <button
              onClick={() => setPage("dashboard")}
              className="w-9 h-9 flex items-center justify-center bg-white shadow rounded-full hover:bg-gray-200"
            >
              ←
            </button>
          )}
          <h1 className="text-2xl font-bold">Point of Sale</h1>
        </div>

        <span
          className={`font-semibold ${
            status === "ONLINE"
              ? "text-green-600"
              : status === "SYNCING"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {status}
        </span>
      </div>

      {/* SEARCH */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product by name or barcode..."
          className="w-full border rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* CATEGORIES */}
      <div className="flex gap-4 overflow-x-auto mb-6">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-xl shadow text-sm ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-white"
          }`}
        >
          All
        </button>

        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedCategory(c._id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow text-sm ${
              selectedCategory === c._id
                ? "bg-blue-600 text-white"
                : "bg-white"
            }`}
          >
            <img
              src={
                c.image ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  c.name
                )}`
              }
              alt={c.name}
              className="w-6 h-6 rounded"
            />
            {c.name}
          </button>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* PRODUCTS */}
        <div className="col-span-8">
          <div className="grid grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
  const qty = getItemQty(p._id);

  return (
    <div
      key={p._id}
      onClick={() => addToCart(p)} // 🔥 Click card to add
      className="bg-white rounded-2xl shadow p-4 hover:bg-blue-50 cursor-pointer transition flex flex-col justify-between"
    >
      {/* PRODUCT INFO */}
      <div>
        <h3 className="font-semibold truncate">
          {p.name}
        </h3>

        <p className="text-gray-500 text-sm mb-4">
          ${p.price}
        </p>
      </div>

      {/* QUANTITY CONTROL */}
      <div
        className="flex justify-between items-center"
        onClick={(e) => e.stopPropagation()} // 🚫 prevent card click when pressing + -
      >
        <div className="flex items-center gap-3">

          <button
            onClick={() => decrease(p._id)}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            −
          </button>

          <span className="font-semibold text-sm min-w-[20px] text-center">
            {qty}
          </span>

          <button
            onClick={() => addToCart(p)}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            +
          </button>
        </div>

        <span className="text-blue-600 font-semibold text-sm">
          ${(p.price * qty).toFixed(2)}
        </span>
      </div>
    </div>
  );
})}
          </div>
        </div>

        {/* INVOICE */}
        <div className="col-span-4 bg-white rounded-2xl shadow p-6 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Invoice</h2>

          <div className="flex-1 overflow-y-auto mb-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} × ${item.price}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  ${(item.quantity * item.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (11%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* CUSTOMER SUGGESTIONS */}
          <div className="relative mb-3">
            <input
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Customer name (Pay Later)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            {showSuggestions && customerName && (
              <div className="absolute z-10 bg-white border w-full rounded shadow max-h-40 overflow-y-auto">
                {nameSuggestions
                  .filter((n) =>
                    n.toLowerCase().includes(customerName.toLowerCase())
                  )
                  .map((name) => (
                    <div
                      key={name}
                      onClick={() => {
                        setCustomerName(name);
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {name}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <button
            onClick={handlePayLater}
            className="w-full bg-yellow-500 text-white py-2 rounded-full mb-3"
          >
            Pay Later
          </button>

          <button
            onClick={() => handleCheckout("cash")}
            className="w-full bg-green-600 text-white py-3 rounded-full mb-2"
          >
            Pay Cash
          </button>

          <button
            onClick={() => handleCheckout("card")}
            className="w-full bg-blue-600 text-white py-3 rounded-full"
          >
            Pay Credit Card
          </button>
        </div>
      </div>
    </div>
  );
}