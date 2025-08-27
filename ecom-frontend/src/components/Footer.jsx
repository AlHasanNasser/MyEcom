import React from "react";

export default function Footer(){
  return (
    <footer className="site-footer">
      <div className="container">
        <p>© {new Date().getFullYear()} MyEcom — Built with React + Django</p>
      </div>
    </footer>
  );
}
