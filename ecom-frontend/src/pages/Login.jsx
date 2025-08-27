import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api, { setAuthToken } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password); // Call the login function from AuthContext
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Invalid credentials");
    }
  };

  return (
    <div className="container login-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Username
          <input value={username} onChange={e=>setUsername(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" type="submit">Login</button>
      </form>
    </div>
  );
}
