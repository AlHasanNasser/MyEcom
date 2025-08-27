import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/api';
import ProductCard from '../components/ProductCard';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchResults() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const query = useQuery();
  const searchTerm = query.get('q');

  useEffect(() => {
    if (searchTerm) {
      setLoading(true);
      api.get(`/products/search/?q=${searchTerm}`)
        .then(response => {
          setProducts(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          setLoading(false);
        });
    }
  }, [searchTerm]);

  return (
    <div className="container">
      <h1>Search Results for "{searchTerm}"</h1>
      {loading ? (
        <p>Loading...</p>
      ) : products.length > 0 ? (
        <div className="grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p>No products found.</p>
      )}
    </div>
  );
}
