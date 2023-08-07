import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAuth } from "../shared/AuthContext";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const {setToken, jwtToken} = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, admin, adminCode }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token; 
        Cookies.set('jwt', token, { secure: false, sameSite: 'strict' });
        setToken(token);
        console.log(jwtToken);
        navigate("/home");
      } else {
        const errorMessage = await response.text();
        window.alert(errorMessage);
      }
    } catch (error) {
      setError("Error during user registration. Please try again later.");
    }
  };

  return (
    <div className="login-container">
      <h1>Registration</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="admin">Admin:</label>
          <input
            type="checkbox"
            id="admin"
            name="admin"
            checked={admin}
            onChange={(e) => setAdmin(e.target.checked)}
          />
        </div>
        {admin && (
          <div className="input-group">
            <label htmlFor="adminCode">Admin Code:</label>
            <input
              type="text"
              id="adminCode"
              name="adminCode"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              required
            />
          </div>
        )}
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
