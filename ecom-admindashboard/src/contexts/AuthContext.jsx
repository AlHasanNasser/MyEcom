import React, { createContext, useState, useEffect } from "react";
import api, { setAuthToken } from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // NEW

  useEffect(() => {
    console.log("AuthContext useEffect [initial load/token change] - token:", token);
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
    }
    setLoading(false); // done initializing
  }, []);

  useEffect(() => {
    console.log("AuthContext useEffect [token dependency] - token:", token);
    if (token) {
      setLoading(true);
      api
        .get("users/me/")
        .then((res) => {
          console.log("AuthContext useEffect [token dependency] - user fetched:", res.data);
          setUser(res.data);
        })
        .catch(() => {
          console.log("AuthContext useEffect [token dependency] - fetch failed");
          setUser(null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      console.log("AuthContext useEffect [token dependency] - token is null, setting user to null");
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      setLoading(true);
      console.log("AuthContext login - attempting login for:", username);
      const res = await api.post("auth/token/", { username, password });
      console.log("AuthContext login - token response:", res.data);
      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);
      setAuthToken(res.data.access);
      setToken(res.data.access);
      console.log("AuthContext login - token set, new token state:", res.data.access);

      // Explicitly fetch and set user immediately after successful token acquisition
      const userRes = await api.get("users/me/");
      console.log("AuthContext login - user fetched immediately:", userRes.data);
      setUser(userRes.data);
      console.log("AuthContext login - user state set to:", userRes.data);
    } catch (err) {
      console.error("Login failed:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setAuthToken(null);
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("AuthContext logout - logging out");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  console.log("AuthContext Provider render - current user:", user);
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
