import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { Link } from 'react-router-dom'
import './Navbar.css'
import logo from '../assets/logo.png'

export default function Navbar({ onLoginSuccess, isLoggedIn, userName }) {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => onLoginSuccess(codeResponse.access_token),
    onError: (error) => console.error('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile',
  })

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
          <Link to="/">Home</Link>
          <a href="#">Goal Setting</a>
          <Link to="/leaderboard">Leaderboard</Link>
        </div>
      </div>

      <div className="navbar-right">
        {isLoggedIn ? (
          <div className="user-status-group">
            {userName && userName !== 'Me' && (
              <span className="user-greeting">Hi, {userName}</span>
            )}
            <span className="connected-status">✓ Calendar Connected</span>
          </div>
        ) : (
          <button className="connect-btn" onClick={() => login()}>
            Connect Calendar
          </button>
        )}
      </div>
    </nav>
  )
}