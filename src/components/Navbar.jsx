import React from "react"
import "./Navbar.css"
import logo from "../assets/logo.png"

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left-group">
        <div className="navbar-left">
          <img src={logo} alt="RBC Logo" className="logo-img" />
          <div className="brand-stack">
            <span>Rational</span>
            <span>Budgeting</span>
            <span>Calendar</span>
          </div>
        </div>

        <div className="navbar-links">
          <a href="#">Goal Setting</a>
          <a href="#">Leaderboard</a>
        </div>
      </div>

      <div className="navbar-right">
        <button className="connect-btn">Connect Calendar</button>
      </div>
    </nav>
  )
}