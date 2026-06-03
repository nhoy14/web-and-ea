import React, { useState, useEffect, useRef } from 'react';

export default function Header({ 
  onNavigate, 
  currentPage, 
  isLoggedIn = false, 
  userEmail = 'user@example.com', 
  isAdmin = false,
  onLogout,
  onOpenProfile,
  onToggleDrawer
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleNavigate = (page) => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    onNavigate(page);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="header-container">
          {/* Brand Logo Group */}
          <div className="logo-group" onClick={() => handleNavigate('home')} style={{ cursor: 'pointer' }}>
            <svg className="logo-icon" viewBox="0 0 40 40" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2L35 10V22C35 30.5 28.5 36.5 20 38C11.5 36.5 5 30.5 5 22V10L20 2Z" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M12 15L16 19L20 13L24 19L28 15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 23V31" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="1.5" fill="var(--primary)"/>
            </svg>
            <span className="brand-name">SuperTrading<span className="accent-text">EA</span></span>
          </div>
          
          {/* Right side navigation / controls */}
          <div className="header-controls">
            {/* Landing Page (Not logged in) */}
            {!isLoggedIn && currentPage === 'home' && (
              <>
                {/* Desktop Links */}
                <nav className="header-nav desktop-nav">
                  <a href="#tutorials" className="nav-link">Tutorials</a>
                  <a href="#community" className="nav-link community-badge">
                    <span className="dot"></span>
                    Community
                  </a>
                  <button className="signin-btn" onClick={() => handleNavigate('login')}>
                    Sign In
                  </button>
                </nav>

                {/* Mobile Hamburger Button */}
                <button 
                  className="header-hamburger" 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {isMobileMenuOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </>
                    ) : (
                      <>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                      </>
                    )}
                  </svg>
                </button>
              </>
            )}

            {/* Logged in state (either Home or Dashboard) */}
            {isLoggedIn && (
              <div className="header-logged-in-controls">
                {currentPage === 'home' && (
                  <nav className="header-nav desktop-nav">
                    <a href="#tutorials" className="nav-link">Tutorials</a>
                    <a href="#community" className="nav-link community-badge">
                      <span className="dot"></span>
                      Community
                    </a>
                  </nav>
                )}

                {/* User Profile Dropdown */}
                <div className="user-profile-dropdown" ref={dropdownRef}>
                  <button className="profile-trigger-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="profile-avatar-circle">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="profile-email-text">{userEmail}</span>
                    <svg className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-user-info">
                        <span className="dropdown-label">Signed in as</span>
                        <span className="dropdown-email" title={userEmail}>{userEmail}</span>
                      </div>
                      <hr className="dropdown-divider" />
                      <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); onOpenProfile(); }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        MT5 Account Info
                      </button>
                      <hr className="dropdown-divider" />
                      {currentPage === 'home' && (
                        <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); handleNavigate('dashboard'); }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
                            <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                            <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                            <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                            <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                          </svg>
                          User Portal
                        </button>
                      )}
                      {currentPage !== 'home' && (
                        <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); handleNavigate('home'); }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          Back to Home
                        </button>
                      )}
                      {isAdmin && currentPage !== 'admin' && (
                        <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); handleNavigate('admin'); }} style={{ color: 'var(--primary)' }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                          Admin Portal
                        </button>
                      )}
                      {isAdmin && currentPage === 'admin' && (
                        <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); handleNavigate('dashboard'); }} style={{ color: 'var(--primary)' }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
                            <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                            <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                            <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                            <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                          </svg>
                          User Portal
                        </button>
                      )}
                      <button className="dropdown-item logout-item" onClick={() => { setIsDropdownOpen(false); onLogout(); }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="item-icon">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Dashboard Menu Drawer Toggle Button */}
                {currentPage === 'dashboard' && (
                  <button 
                    className="header-hamburger dashboard-hamburger" 
                    onClick={onToggleDrawer}
                    aria-label="Toggle sidebar drawer"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer (rendered outside header to avoid position fixed backdrop-filter constraints) */}
      {!isLoggedIn && currentPage === 'home' && (
        <>
          {isMobileMenuOpen && (
            <div className="mobile-nav-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
          )}
          <nav className={`mobile-nav-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="drawer-header">
              <div className="logo-group" onClick={() => handleNavigate('home')}>
                <svg className="logo-icon" viewBox="0 0 40 40" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2L35 10V22C35 30.5 28.5 36.5 20 38C11.5 36.5 5 30.5 5 22V10L20 2Z" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round"/>
                  <path d="M12 15L16 19L20 13L24 19L28 15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 23V31" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="20" cy="20" r="1.5" fill="var(--primary)"/>
                </svg>
                <span className="brand-name" style={{ fontSize: '18px' }}>SuperTrading<span className="accent-text">EA</span></span>
              </div>
              <button className="btn-close-drawer" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="drawer-links">
              <a href="#tutorials" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Tutorials</a>
              <a href="#community" className="mobile-nav-link mobile-community-badge" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="dot"></span>
                Community
              </a>
              <button className="signin-btn mobile-signin-btn" onClick={() => handleNavigate('login')}>
                Sign In
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

