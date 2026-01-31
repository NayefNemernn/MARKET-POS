import { useState } from "react";

export const useCart = () => {
  const [cart, setCart] = useState([]);

  /* ======================
     ADD TO CART
  ====================== */
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find(
        (item) => item.productId === product._id
      );

      // already in cart
      if (exists) {
        // 🚫 prevent exceeding stock
        if (exists.quantity >= product.stock) {
          alert(`⚠️ Only ${product.stock} in stock`);
          return prev;
        }

        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // new item
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          stock: product.stock, // 🔑 needed for validation
          quantity: 1
        }
      ];
    });
  };

  /* ======================
     INCREASE QTY
  ====================== */
  const increase = (id) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === id) {
          if (item.quantity >= item.stock) {
            alert(`⚠️ Only ${item.stock} in stock`);
            return item;
          }
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  /* ======================
     DECREASE QTY
  ====================== */
  const decrease = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  /* ======================
     CLEAR CART
  ====================== */
  const clearCart = () => setCart([]);

  /* ======================
     TOTAL
  ====================== */
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    cart,
    addToCart,
    increase,
    decrease,
    clearCart,
    total
  };
};
