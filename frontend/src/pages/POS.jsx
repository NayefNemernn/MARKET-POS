import React, { useState, useRef, useEffect } from "react";
import { getProductByBarcode } from "../api/product.api";
import { createSale } from "../api/sale.api";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../context/AuthContext";
import Receipt from "./Receipt";

export default function POS() {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState(null);

  const { logout } = useAuth();
  const { cart, addToCart, clearCart, total } = useCart();

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lastSale) return;
      if (e.key === "F9") handleCheckout();
      if (e.key === "Escape") {
        clearCart();
        setBarcode("");
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, lastSale]);

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode);
      addToCart(product);
      setBarcode("");
    } catch {
      setError("Product not found");
      setBarcode("");
      setTimeout(() => setError(""), 1500);
    }
    inputRef.current?.focus();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const res = await createSale({
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity
        })),
        paymentMethod: "cash"
      });

      setLastSale(res.sale);
      clearCart();
      setBarcode("");
    } catch {
      alert("Checkout failed");
    }
  };

  if (lastSale) {
    return (
      <Receipt
        sale={lastSale}
        onClose={() => {
          setLastSale(null);
          inputRef.current?.focus();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🧾 POS Terminal</h1>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        {/* Barcode Input */}
        <form onSubmit={handleScan} className="flex gap-3 mb-4">
          <input
            ref={inputRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or enter barcode"
            className="flex-1 border border-gray-300 rounded px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          <button className="bg-blue-600 text-white px-6 rounded hover:bg-blue-700">
            Add
          </button>
        </form>

        {error && (
          <p className="text-red-600 font-medium mb-3">{error}</p>
        )}

        {/* Cart Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-3">Product</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.productId} className="border-b">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">
                    {item.price * item.quantity}
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-400">
                    No items scanned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mt-6">
          <h2 className="text-2xl font-bold">
            Total: <span className="text-green-600">{total}</span>
          </h2>

          <button
            onClick={handleCheckout}
            className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-green-700"
          >
            Checkout (F9)
          </button>
        </div>

        {/* Shortcuts */}
        <p className="text-sm text-gray-500 mt-4">
          Shortcuts: <b>F9</b> Checkout · <b>ESC</b> Clear cart
        </p>
      </div>
    </div>
  );
}
