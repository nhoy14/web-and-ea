import React, { useState, useEffect } from 'react';

export default function Login({ onNavigate, onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cloudflareState, setCloudflareState] = useState('idle'); // 'idle', 'verifying', 'success'
  const [isLoading, setIsLoading] = useState(false);

  // Reset inputs and security checks when toggling forms
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCloudflareState('idle');
  }, [isSignUp]);

  const handleCloudflareCheck = () => {
    if (cloudflareState === 'idle') {
      setCloudflareState('verifying');
    }
  };

  useEffect(() => {
    if (cloudflareState === 'verifying') {
      const timer = setTimeout(() => {
        setCloudflareState('success');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [cloudflareState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cloudflareState !== 'success') {
      alert('Please complete the verification security check.');
      return;
    }

    setIsLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        alert('Passwords do not match. Please re-enter.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed');
        }
        alert('Registration successful! Logging you in...');
      } catch (err) {
        alert(err.message);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed. Incorrect email or password.');
      }
      
      if (onLogin) {
        onLogin(data.email, data.access_token, data.is_admin);
      } else {
        onNavigate('dashboard');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Back to Home Link */}
      <div className="back-home-wrapper">
        <button onClick={() => onNavigate('home')} className="back-home-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="back-arrow">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </button>
      </div>

      {/* Brand Header */}
      <div className="login-logo-group">
        <svg className="logo-icon" viewBox="0 0 40 40" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2L35 10V22C35 30.5 28.5 36.5 20 38C11.5 36.5 5 30.5 5 22V10L20 2Z" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="M12 15L16 19L20 13L24 19L28 15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 23V31" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="20" cy="20" r="1.5" fill="var(--primary)"/>
        </svg>
        <h2 className="brand-name">SuperTrading<span className="accent-text">EA</span></h2>
        <p className="login-subtitle-top">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>
      </div>

      {/* Login / Sign Up Card */}
      <div className="login-card">
        <div className="login-card-header">
          <h3 className="card-welcome-title">
            {isSignUp ? 'Get Started' : 'Welcome Back'}
          </h3>
          <p className="card-welcome-subtitle">
            {isSignUp ? 'Enter your details to create your portal' : 'Enter your credentials to access your portal'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Name Field (Only in Sign Up mode) */}
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">Full Name</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="name-input"
                  type="text"
                  required
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                id="email-input"
                type="email"
                required
                className="form-input"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="password-label-row">
              <label className="form-label" htmlFor="password-input">Password</label>
              {!isSignUp && (
                <a href="#forgot" className="forgot-link">Forgot password?</a>
              )}
            </div>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Only in Sign Up mode) */}
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password-input">Confirm Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Cloudflare Turnstile Simulator */}
          <div className="cloudflare-widget" onClick={handleCloudflareCheck}>
            <div className="cloudflare-content">
              {cloudflareState === 'idle' && (
                <>
                  <div className="cf-checkbox"></div>
                  <span className="cf-label">Verify you are human</span>
                </>
              )}
              {cloudflareState === 'verifying' && (
                <>
                  <div className="cf-spinner"></div>
                  <span className="cf-label">Verifying...</span>
                </>
              )}
              {cloudflareState === 'success' && (
                <>
                  <div className="cf-success-badge">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="cf-label success-text">Success!</span>
                </>
              )}
            </div>
            
            <div className="cloudflare-logo-sec">
              <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor">
                <path d="M28 17.5c0-1.2-.5-2.2-1.2-3 .5-.7.7-1.6.7-2.5 0-2.2-1.8-4-4-4-.4 0-.8.1-1.2.2C21.4 6.8 19 5.8 16.5 5.8c-3.9 0-7.2 2.6-8.2 6.2-.4-.2-.9-.3-1.4-.3-2.5 0-4.5 2-4.5 4.5 0 .2 0 .4.1.6C1 17.5 0 18.9 0 20.5c0 2.5 2 4.5 4.5 4.5h23c2.5 0 4.5-2 4.5-4.5 0-1.4-.6-2.6-1.6-3.4.1-.2.1-.4.1-.6z" fill="#f38020"/>
                <path d="M28 20H4a1 1 0 110-2h24a1 1 0 110 2z" fill="#fff" opacity="0.3"/>
              </svg>
              <div className="cf-brand">
                <span className="cf-brand-title">CLOUDFLARE</span>
                <span className="cf-brand-desc">Privacy • Terms</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          {/* Toggle Link */}
          <div className="signup-prompt">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="signup-link-btn"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="signup-link-btn"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Copyright Footer */}
      <footer className="login-footer">
        © 2026 SuperTradingEA. All rights reserved.
      </footer>
    </div>
  );
}
