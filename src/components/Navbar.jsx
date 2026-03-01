import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import './Navbar.css'
import logo from '../assets/logo.png'

export default function Navbar({ onLoginSuccess, isLoggedIn }) {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => onLoginSuccess(codeResponse.access_token),
    onError: (error) => console.error('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
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
          <a href="#">Goal Setting</a>
          <a href="#">Leaderboard</a>
        </div>
      </div>

      <div className="navbar-right">
        {isLoggedIn ? (
          <span className="connected-status">✓ Calendar Connected</span>
        ) : (
          <button className="connect-btn" onClick={() => login()}>
            Connect Calendar
          </button>
        )}
      </div>
    </nav>
  )
}