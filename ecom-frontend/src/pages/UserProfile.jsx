import React, { useState, useEffect, useContext } from 'react';
import api, { markOrderAsSeen } from '../api/api';
import { AuthContext } from '../contexts/AuthContext';

export default function UserProfile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      api.get('/my-orders/')
        .then(response => {
          console.log('Orders fetched:', response.data);
          setOrders(response.data);
          setLoading(false);

          // Mark unseen orders as seen
          response.data.forEach(order => {
            if (!order.is_seen) {
              markOrderAsSeen(order.id)
                .then(() => console.log(`Order ${order.id} marked as seen`))
                .catch(error => console.error(`Error marking order ${order.id} as seen:`, error));
            }
          });
        })
        .catch(error => {
          console.error('Error fetching orders:', error);
          setLoading(false);
        });
    }
  }, [user]);

  const getStatusClassName = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Shipped':
        return 'status-shipped';
      case 'Delivered':
        return 'status-delivered';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="container"><p>Loading orders...</p></div>;
  }

  return (
    <div className="container">
      <h1>Your Orders</h1>
      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <strong>Order ID:</strong> {order.id}
                </div>
                <div>
                  <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div>
                  <strong>Total:</strong> ${order.total}
                </div>
                <div>
                  <strong>Status:</strong> <span className={getStatusClassName(order.status)}>{order.status}</span>
                </div>
              </div>
              <div className="order-items">
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="item-image">
                      <img src={item.product.image || '/placeholders/placeholder.png'} alt={item.product.name} />
                    </div>
                    <div className="item-details">
                      <strong>{item.product.name}</strong>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>You have no orders.</p>
      )}
    </div>
  );
}
