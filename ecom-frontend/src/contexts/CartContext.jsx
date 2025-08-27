import React, { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const add = (product, qty = 1) => {
    setItems(prev => {
      const found = prev.find(i => i.product.id === product.id);
      if (found) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(qty, product.stock) }];
    });
  };
  const remove = (productId) => setItems(prev => prev.filter(i => i.product.id !== productId));
  const clear = () => setItems([]);
  const total = () => items.reduce((s,i) => s + i.product.price * i.quantity, 0);

  return <CartContext.Provider value={{ items, add, remove, clear, total }}>{children}</CartContext.Provider>;
};
