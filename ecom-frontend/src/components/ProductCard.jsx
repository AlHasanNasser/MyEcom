import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ product }){
  const imgSrc = product.image ? product.image : "/placeholders/placeholder.png";
 
  
  return (
    <div className="card">
      <div className="card-image-container">
        <Link to={`/product/${product.id}`}>
          <img src={imgSrc} alt={product.name} />
        </Link>
        {product.stock <= 0 && <div className="out-of-stock-badge">Out of Stock</div>}
      </div>
      <div className="card-body">
        <Link to={`/product/${product.id}`}><h3>{product.name}</h3></Link>
        <p>${product.price}</p>
      </div>
    </div>
  );

}