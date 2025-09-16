// src/components/Login.js
import React from 'react';
import './Login.css';

function Login() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Xeno CRM</h1>
        <p>Sign in to access your customer management platform</p>
        <button className="google-login-btn" onClick={handleGoogleLogin}>
          <img src="/google-icon.svg" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;