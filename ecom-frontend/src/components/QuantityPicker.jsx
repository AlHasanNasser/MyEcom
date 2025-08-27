import React from "react";

export default function QuantityPicker({ quantity, setQuantity, max = 99 }){
  const inc = () => setQuantity(q => Math.min(max, q + 1));
  const dec = () => setQuantity(q => Math.max(1, q - 1));
  return (
    <div className="quantity-picker">
      <button onClick={dec} className="qty-btn">-</button>
      <input type="number" value={quantity} min={1} max={max}
        onChange={(e) => {
          const v = Math.max(1, Math.min(max, Number(e.target.value || 1)));
          setQuantity(v);
        }} />
      <button onClick={inc} className="qty-btn">+</button>
    </div>
  );
}
