import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ product }){
  const imgSrc = product.image ? product.image : "/placeholders/placeholder.png";
  return (
    <div className="card">
      <Link to={`/product/${product.id}`}><img src={imgSrc} alt={product.name} /></Link>
      <div className="card-body">
        <Link to={`/product/${product.id}`}><h3>{product.name}</h3></Link>
        <p>${product.price}</p>
      </div>
    </div>
  );
}
