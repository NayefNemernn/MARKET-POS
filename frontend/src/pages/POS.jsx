import React, { useState, useRef, useEffect } from "react";
import { getProductByBarcode } from "../api/product.api";
import { createSale } from "../api/sale.api";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../context/AuthContext";

export default function POS() {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");

  const { logout } = useAuth();
  const { cart, addToCart, clearCart, total } = useCart();

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F9") {
        handleCheckout();
      }

      if (e.key === "Escape") {
        clearCart();
        window.location.reload();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, clearCart]);

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");

    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode);
      addToCart(product);
      setBarcode("");
      inputRef.current?.focus();
    } catch {
      setError("Product not found");
      setBarcode("");
      setTimeout(() => setError(""), 1500);
      inputRef.current?.focus();
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      await createSale({
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMethod: "cash"
      });

      clearCart();
      alert("Sale completed");
      window.location.reload(); // FORCE RESET POS
    } catch {
      alert("Checkout failed");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload(); // FORCE LOGIN SCREEN
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, position: "relative" }}>
      {/* LOGOUT */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

      <h1>POS</h1>

      <form onSubmit={handleScan}>
        <input
          ref={inputRef}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Scan barcode"
          autoComplete="off"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {cart.map((item) => (
          <li key={item.productId}>
            {item.name} × {item.quantity} ={" "}
            {item.price * item.quantity}
          </li>
        ))}
      </ul>

      <h3>Total: {total}</h3>

      <button onClick={handleCheckout}>
        Checkout (F9)
      </button>

      <p style={{ marginTop: 10, fontSize: 12 }}>
        Shortcuts: <b>F9</b> = Checkout | <b>ESC</b> = Clear cart
      </p>
    </div>
  );
}
