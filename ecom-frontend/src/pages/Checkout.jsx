import React, { useState, useContext } from 'react';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext'; // ADDED
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Checkout(){
  const { items, clear, total } = useContext(CartContext);
  const { user } = useContext(AuthContext); // ADDED
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  if (!items.length) return <div className="container"><h3>Your cart is empty</h3></div>;

  const handlePlaceOrder = async () => {
    console.log('User object in Checkout before placing order:', user);
    if (!user) {
      alert("You need to be logged in to place an order.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        address,
        payment_method: "cod"
      };
      const response = await api.post('/create-order/', payload);
      console.log('Order creation response:', response.data);
      clear();
      navigate("/"); // go to home or orders page
      // Optionally show a success toast
    } catch (err) {
      console.error(err);
      alert("Failed to place order. An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container checkout-page">
      <h2>Checkout</h2>
      <div className="checkout-grid">
        <div>
          <h3>Shipping</h3>
          <textarea placeholder="Enter shipping address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <h3>Order Summary</h3>
          <ul>
            {items.map(i => (
              <li key={i.product.id}>{i.product.name} x {i.quantity} — ${ (i.product.price * i.quantity).toFixed(2) }</li>
            ))}
          </ul>
          <p><strong>Total:</strong> ${ total().toFixed(2) }</p>
          <button className="btn-primary" onClick={handlePlaceOrder} disabled={loading}>
            {loading ? "Placing order..." : "Place order (Cash on delivery)"}
          </button>
        </div>
      </div>
    </div>
  );
}