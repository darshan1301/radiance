import React from "react";

export default function Footer() {
  const date = new Date();
  const year = date.getFullYear();
  return (
      <footer className="footer">
      <p>© {year} Radiance. All rights reserved.</p>
    </footer>
  );
}
