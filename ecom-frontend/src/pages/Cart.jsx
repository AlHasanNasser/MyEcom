import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../contexts/CartContext";

export default function Cart(){
  const { items, remove, clear, total } = useContext(CartContext);
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="container">
        <h2>Your cart is empty</h2>
        <Link to="/">Continue shopping</Link>
      </div>
    );
  }

  const handleCheckout = () => navigate("/checkout");

  return (
    <div className="container cart-page">
      <h2>Your Cart</h2>
      <div className="cart-list">
        {items.map(i => (
          <div className="cart-item" key={i.product.id}>
            <img className="cart-thumb" src={i.product.image || "/placeholders/placeholder.png"} alt={i.product.name}/>
            <div className="cart-info">
              <h4>{i.product.name}</h4>
              <p>${i.product.price} × {i.quantity}</p>
            </div>
            <div className="cart-actions">
              <button className="btn-link" onClick={() => remove(i.product.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <p><strong>Total:</strong> ${total().toFixed(2)}</p>
        <div className="cart-buttons">
          <button className="btn-secondary" onClick={clear}>Clear cart</button>
          <button className="btn-primary" onClick={handleCheckout}>Checkout</button>
        </div>
      </div>
    </div>
  );
}
