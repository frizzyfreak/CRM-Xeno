// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/">Xeno CRM</Link>
        </div>
        
        {user && (
          <>
            <div className="navbar-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/create-campaign">Create Campaign</Link>
              <Link to="/campaign-history">Campaign History</Link>
            </div>
            
            <div className="navbar-user">
              <img 
                src={user.picture || '/default-avatar.png'} 
                alt={user.name} 
                className="user-avatar"
              />
              <span>{user.name}</span>
              <button onClick={logout} className="logout-btn">
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;