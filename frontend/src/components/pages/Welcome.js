import React from "react";

function Welcome() {
  return (
    <div>
      <header>
        <h3 href="/home" className="logo">
          Radiance
        </h3>
      </header>
      <div className="fun-background">
        <div className="content">
          <h1>Welcome to Radiance</h1>
          <p>
            Experience the magic of Radiance - a place to connect and share your
            moments!
          </p>
          <div className="buttons">
            <a href="/register" className="register-btn">
              Register
            </a>
            <a href="/login" className="login-btn">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
