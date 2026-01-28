import { useState } from "react";

export const useCart = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const exists = cart.find(
      (item) => item.productId === product._id
    );

    if (exists) {
      setCart(
        cart.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1
        }
      ]);
    }
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    cart,
    addToCart,
    clearCart,
    total
  };
};
