import React, { useEffect, useState } from "react";
import api from "../api/api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
        api.get("products/"),
        api.get("categories/")
    ]).then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
    }).catch(err => {
        console.error("Failed to load data", err);
    }).finally(() => {
        setLoading(false);
    });
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category.id === selectedCategory)
    : products;

  const renderProducts = () => {
    if (loading) {
      return <p>Loading products...</p>;
    }
    if (products.length === 0) {
      return <p>No products available.</p>;
    }
    if (filteredProducts.length === 0) {
      return <p>N  this category.</p>;
    }
    return filteredProducts.map((p) => <ProductCard key={p.id} product={p} />);
  }

  return (
    <div className="container">
      <h1>Products</h1>
      <div className="category-filters">
        <button
          onClick={() => setSelectedCategory(null)}
          className={!selectedCategory ? "active" : ""}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={selectedCategory === c.id ? "active" : ""}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="grid">
        {renderProducts()}
      </div>
    </div>
  );
}
