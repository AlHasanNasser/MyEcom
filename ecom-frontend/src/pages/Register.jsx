import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Register(){
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password2: ""
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("users/register/", form);
      alert("Registration successful. You can now log in.");
      navigate("/login");
    } catch (err) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Registration failed.");
      }
    }
  };

  return (
    <div className="container register-page">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Username
          <input name="username" value={form.username} onChange={handleChange} required />
        </label>
        <label>Email
          <input type="email" name="email" value={form.email} onChange={handleChange} />
        </label>
        <label>First Name
          <input name="first_name" value={form.first_name} onChange={handleChange} />
        </label>
        <label>Last Name
          <input name="last_name" value={form.last_name} onChange={handleChange} />
        </label>
        <label>Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>
        <label>Confirm Password
          <input type="password" name="password2" value={form.password2} onChange={handleChange} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" type="submit">Register</button>
      </form>
    </div>
  );
}
