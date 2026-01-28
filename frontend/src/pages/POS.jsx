import React, { useState } from "react";
import { getProductByBarcode } from "../api/product.api";
import { createSale } from "../api/sale.api";
import { useCart } from "../hooks/useCart";

export default function POS() {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");

  const { cart, addToCart, clearCart, total } = useCart();

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");

    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode);
      addToCart(product);
      setBarcode("");
    } catch (err) {
      setError("Product not found");
      setBarcode("");
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
    } catch {
      alert("Checkout failed");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>POS</h1>

      <form onSubmit={handleScan}>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Scan barcode"
          autoFocus
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
        Checkout
      </button>
    </div>
  );
}
