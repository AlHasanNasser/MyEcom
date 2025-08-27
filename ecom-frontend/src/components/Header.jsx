import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import api from "../api/api";

export default function Header() {
  const { user, logout, loading } = useContext(AuthContext);
  const { items } = useContext(CartContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${query.trim()}`);
      setQuery("");
      setSuggestions([]);
    }
  };

  const fetchSuggestions = useCallback((searchQuery) => {
    if (searchQuery.length > 1) {
      setLoadingSuggestions(true);
      api.get(`/products/search/?q=${searchQuery}`)
        .then(res => {
          const products = res.data;
          const words = new Set();
          products.forEach(product => {
            product.name.toLowerCase().split(/\s+/).forEach(word => {
              const cleanedWord = word.replace(/[^a-z0-9]/gi, '');
              if(cleanedWord) {
                words.add(cleanedWord);
              }
            });
          });
          setSuggestions(Array.from(words));
        })
        .catch(err => {
          console.error("Error fetching suggestions", err);
          setSuggestions([]);
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    } else {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [query, fetchSuggestions]);

  const handleSuggestionClick = (suggestion) => {
    setQuery("");
    setSuggestions([]);
    navigate(`/search?q=${suggestion}`);
  };

  const cartCount = (items || []).reduce((s, i) => s + i.quantity, 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">MyEcom</Link>
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="search-input"
              autoComplete="off"
            />
            <button type="submit" className="search-button">Search</button>
          </form>
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {loadingSuggestions ? (
                <li className="suggestion-item">Loading...</li>
              ) : (
                suggestions.map(suggestion => (
                  <li
                    key={suggestion}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/cart">Cart ({cartCount})</Link>
          {loading ? (
            <span>Loading...{/* prevent flicker */}</span>
          ) : user ? (
            <div className="profile-dropdown" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="profile-btn">
                <span>Profile</span>
                <span className="arrow">▼</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    Signed in as <br />
                    <strong>{user.email}</strong>
                  </div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Your Profile</Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Settings</Link>
                  <button onClick={handleLogout} className="dropdown-item btn-link">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
