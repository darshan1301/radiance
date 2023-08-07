import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";


export default function Navbar() {
  const navigate = useNavigate();
  const { clearToken }=  useAuth();

  const handleLogout = () => {
    clearToken();
    console.log("token deleted");
    navigate("/");
  };

  return (
    <div>
    <header>
      <nav>
        <div className="logo">
          <a href="/home">Radiance</a>
        </div>
        <ul className="navbar">
        <li>
            <a href="/home">Feed</a>
          </li>
          <li>
            <a href="/adminPanel">Admin Panel</a>
          </li>
          <li>
            <a href="/" onClick={handleLogout}>Logout</a>
          </li>
        </ul>
      </nav>
    </header>
    <Outlet/>
    </div>
  );
}
