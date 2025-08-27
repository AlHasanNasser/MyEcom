import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { CartContext } from "../contexts/CartContext";
import QuantityPicker from "../components/QuantityPicker";

export default function ProductPage(){
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { add } = useContext(CartContext);

  useEffect(() => {
    api.get(`products/${id}/`).then(res => setProduct(res.data)).catch(()=>{});
  }, [id]);

  if (!product) return <div className="container">Loading...</div>;

  const imgSrc = product.image || "/placeholders/placeholder.png";

  return (
    <div className="container product-page">
      <div className="product-grid">
        <div className="product-media">
          <img src={imgSrc} alt={product.name} className="product-image" />
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="price">${product.price}</p>
          <p>{product.description}</p>
          <p><strong>In stock:</strong> {product.stock}</p>

          <div className="actions">
            <QuantityPicker quantity={qty} setQuantity={setQty} max={product.stock} />
            <button
              className="btn-primary"
              onClick={() => add(product, qty)}
              disabled={product.stock <= 0}
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
