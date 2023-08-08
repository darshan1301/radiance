import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Welcome from "./components/pages/Welcome";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import AdminPanel from "./components/pages/AdminPanel";
import { AuthProvider } from "./components/shared/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/adminPanel" element={<AdminPanel />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
