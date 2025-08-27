import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Header from "./components/Header";
import Register from "./pages/Register";
import SearchResults from "./pages/SearchResults";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import { AuthContext } from "./contexts/AuthContext";

function App(){
  const { user } = useContext(AuthContext);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}
export default App;
