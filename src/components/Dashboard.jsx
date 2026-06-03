import React, { useState, useEffect } from 'react';
import Pricing from './Pricing';

function LicenseCountdown({ expiryDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryDate) - new Date();
      if (difference <= 0) {
        return 'Expired';
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const pad = (num) => String(num).padStart(2, '0');

      if (days > 0) {
        return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
      }
      return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  return (
    <span className="countdown-value" style={{ color: timeLeft === 'Expired' ? '#ef4444' : 'var(--primary)', fontWeight: 'bold', fontFamily: 'monospace' }}>
      {timeLeft}
    </span>
  );
}

export default function Dashboard({
  onNavigate,
  userEmail,
  token,
  isAdmin = false,
  onLogout,
  isDrawerOpen,
  setIsDrawerOpen
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'licenses', 'vps', 'pricing', 'bots', 'subscriptions'
  const [botSubTab, setBotSubTab] = useState('bots'); // 'bots' or 'settings'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [licenses, setLicenses] = useState([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateMonths, setGenerateMonths] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic bots state
  const [bots, setBots] = useState([]);
  const fetchBots = async () => {
    try {
      const response = await fetch('/api/bots');
      if (response.ok) {
        const data = await response.json();
        setBots(data);
      }
    } catch (err) {
      console.error("Error fetching bots:", err);
    }
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setIsDrawerOpen(false); // Auto close mobile drawer on tab selection
  };

  const fetchLicenses = async () => {
    if (!token) return;
    setIsLoadingLicenses(true);
    try {
      const response = await fetch('/api/licenses/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLicenses(data);
      }
    } catch (err) {
      console.error("Error fetching licenses:", err);
    } finally {
      setIsLoadingLicenses(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLicenses();
      fetchBots();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'licenses' || activeTab === 'subscriptions') {
      fetchLicenses();
    } else if (activeTab === 'bots') {
      fetchBots();
    }
  }, [activeTab]);

  const handlePurchaseMock = async (planName) => {
    if (!token) {
      alert("Please login first.");
      onNavigate('login');
      return;
    }

    const isYearly = planName.includes('Yearly');
    const expiryMonths = isYearly ? 12 : 1;

    try {
      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ expiry_months: expiryMonths })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate license key');
      }
      alert(`Success! Generated license key for ${planName}.`);
      await fetchLicenses();
      selectTab('licenses');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRefreshBots = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchBots().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    });
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!token) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ expiry_months: generateMonths })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate license key');
      }
      alert(`Success! Generated new license key.`);
      setIsGenerateModalOpen(false);
      await fetchLicenses();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="dashboard-container">
      {/* Drawer Backdrop Blur Overlay */}
      {isDrawerOpen && (
        <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)}></div>
      )}

      {/* Sidebar Navigation Panel / Drawer */}
      <aside className={`dashboard-sidebar ${isDrawerOpen ? 'drawer-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-with-info">
            <svg className="logo-icon" viewBox="0 0 40 40" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2L35 10V22C35 30.5 28.5 36.5 20 38C11.5 36.5 5 30.5 5 22V10L20 2Z" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M12 15L16 19L20 13L24 19L28 15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 23V31" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="1.5" fill="var(--primary)" />
            </svg>
            <div className="brand-texts">
              <span className="brand-title">User Portal</span>
              <span className="brand-subtitle">Dashboard</span>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={() => setIsDrawerOpen(false)} aria-label="Close navigation menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => selectTab('overview')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1"></rect>
              <rect x="14" y="12" width="7" height="9" rx="1"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1"></rect>
            </svg>
            Overview
          </button>

          <button
            className={`menu-item ${activeTab === 'licenses' ? 'active' : ''}`}
            onClick={() => selectTab('licenses')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L14 9M18.5 4.5l-1.5 1.5"></path>
            </svg>
            My Licenses
          </button>

          <button
            className={`menu-item ${activeTab === 'vps' ? 'active' : ''}`}
            onClick={() => selectTab('vps')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            VPS Credentials
          </button>

          <button
            className={`menu-item ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => selectTab('pricing')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Pricing Plans
          </button>

          <button
            className={`menu-item ${activeTab === 'bots' ? 'active' : ''}`}
            onClick={() => selectTab('bots')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Bots
          </button>

          <button
            className={`menu-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => selectTab('subscriptions')}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            My Subscriptions
          </button>

          {isAdmin && (
            <button
              className="menu-item admin-sidebar-item"
              onClick={() => onNavigate('admin')}
              style={{ color: 'var(--primary)', borderLeft: '3px solid var(--primary)', background: 'rgba(0, 240, 255, 0.03)' }}
            >
              <svg className="menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Admin Portal
            </button>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="dashboard-content-area">
        {/* Dynamic Tab Switcher */}
        {activeTab === 'overview' && (
          <div className="panel-overview">
            {licenses.length > 0 ? (
              <div className="overview-center-box" style={{ maxWidth: '650px' }}>
                <div className="cart-icon-container" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <svg className="cart-icon-svg" viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 className="overview-welcome-title">Your Trading is Active!</h2>
                <p className="overview-welcome-desc">
                  You have {licenses.length} active license{licenses.length > 1 ? 's' : ''} configured in your account. You can manage your keys, bind them to MT5 accounts, or download latest bots and settings presets.
                </p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="overview-cta-btn" onClick={() => selectTab('licenses')}>
                    Manage Licenses
                  </button>
                  <button className="overview-cta-btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} onClick={() => selectTab('bots')}>
                    Download Bots
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-center-box">
                <div className="cart-icon-container">
                  <svg className="cart-icon-svg" viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </div>
                <h2 className="overview-welcome-title">Welcome to Your Dashboard</h2>
                <p className="overview-welcome-desc">
                  You haven't purchased any subscriptions yet. Get started with our trading platform by choosing a plan that fits your needs.
                </p>
                <button className="overview-cta-btn" onClick={() => selectTab('pricing')}>
                  <svg className="btn-icon-left" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  View Pricing Plans
                  <svg className="btn-icon-right" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
                <span className="overview-small-legend">Choose between EA licenses or VPS hosting plans</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="panel-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="panel-title" style={{ marginBottom: '4px' }}>My Licenses</h2>
                <p className="panel-subtitle" style={{ margin: 0 }}>Manage your active SuperTradingEA trading keys</p>
              </div>
              <button
                className="overview-cta-btn"
                onClick={() => {
                  setGenerateMonths(12);
                  setIsGenerateModalOpen(true);
                }}
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Generate New Key
              </button>
            </div>

            <div className="dashboard-card-box">
              {licenses.length > 0 ? (
                <div className="licenses-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                  {licenses.map((lic) => (
                    <div key={lic.id} className="license-active-box" style={{ width: '100%' }}>
                      <div className="license-header">
                        <span className={`status-badge ${lic.is_active ? 'live' : 'disabled'}`} style={{
                          backgroundColor: lic.is_active ? '#10b981' : '#ef4444',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {lic.is_active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                        <span className="license-plan-type">
                          {lic.key.startsWith('STEA-') ? 'STEA Promo Key' : 'Standard License'}
                        </span>
                      </div>
                      <div className="license-code-block">
                        <code>{lic.key}</code>
                        <button className="btn-copy" onClick={() => {
                          navigator.clipboard.writeText(lic.key);
                          alert('Copied to clipboard!');
                        }}>Copy</button>
                      </div>
                      <div className="license-metadata">
                        <div className="meta-item">
                          <span className="meta-label">Bound Account:</span>
                          <span className="meta-value" style={{ color: lic.assigned_account ? '#fff' : '#888' }}>
                            {lic.assigned_account || 'Not Bound (Pending First Run)'}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Expiration Date:</span>
                          <span className="meta-value">
                            {new Date(lic.expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Time Remaining:</span>
                          <span className="meta-value">
                            <LicenseCountdown expiryDate={lic.expiry_date} />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3"></path>
                  </svg>
                  {isLoadingLicenses ? (
                    <h3>Loading licenses...</h3>
                  ) : (
                    <>
                      <h3>No Active Licenses Found</h3>
                      <p>Purchase a plan to generate a trading key and link your MetaTrader account.</p>
                      <button className="btn-primary-mini" onClick={() => selectTab('pricing')}>Buy License</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vps' && (
          <div className="panel-tab">
            <h2 className="panel-title">VPS Credentials</h2>
            <p className="panel-subtitle">Your active VPS server configuration for 24/7 automated trading</p>

            <div className="dashboard-card-box">
              <div className="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                </svg>
                <h3>No Active VPS Hosting</h3>
                <p>Run your EA bots 24/7 without terminal disruptions by ordering an optimized trading VPS.</p>
                <button className="btn-primary-mini" onClick={() => selectTab('pricing')}>Order VPS</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="panel-tab pricing-tab-view">
            <h2 className="panel-title">Pricing & Subscriptions</h2>
            <p className="panel-subtitle">Choose the plan that matches your current account size and strategy</p>

            <div className="dashboard-pricing-wrapper">
              <Pricing onNavigate={handlePurchaseMock} />
            </div>
          </div>
        )}

        {/* Detailed Bots and Settings Library Section */}
        {activeTab === 'bots' && (
          <div className="panel-tab bots-tab-view">
            {/* Top Library Header */}
            <div className="bots-panel-header">
              <span className="library-badge">
                <span className="dot animate-pulse-glow"></span>
                Bot Library
              </span>
              <h2 className="panel-title">Download Bots & Settings</h2>
              <p className="panel-subtitle">Grab the latest admin-approved EA files and settings with a single click.</p>
            </div>

            {/* Sub-tab segmented controller + Refresh button */}
            <div className="bots-controls-row">
              <div className="bots-segmented-control">
                <button
                  className={`sub-tab-btn ${botSubTab === 'bots' ? 'active' : ''}`}
                  onClick={() => setBotSubTab('bots')}
                >
                  <svg className="tab-btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                    <path d="M12 2v9M8 5h8"></path>
                  </svg>
                  Bots
                </button>
                <button
                  className={`sub-tab-btn ${botSubTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setBotSubTab('settings')}
                >
                  <svg className="tab-btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Settings
                </button>
              </div>

              <button
                className="btn-refresh-bots"
                onClick={handleRefreshBots}
                disabled={isRefreshing}
                aria-label="Refresh bots list"
              >
                <svg
                  className={`refresh-icon-svg ${isRefreshing ? 'rotate-animation' : ''}`}
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                Refresh
              </button>
            </div>

            {/* Bots Grid (Staggered Entrance Animation) */}
            {botSubTab === 'bots' ? (
              <div className="bots-releases-grid">
                {bots.filter(b => b.type === 'bot').map((bot, index) => (
                  <div
                    key={bot.id}
                    className="bot-release-card card-animate"
                    style={{ '--index': index }}
                  >
                    <div className="card-top-header">
                      <div className="bot-icon-badge">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                          <path d="M12 2v9M8 5h8"></path>
                        </svg>
                      </div>
                      <div className="card-bot-meta">
                        <h3 className="card-bot-title">{bot.title}</h3>
                        <span className="card-bot-subtitle">{bot.subtext}</span>
                      </div>
                      <span className="ready-pill">{bot.badge}</span>
                    </div>

                    <ul className="bot-release-bullets">
                      {(bot.bullets ? bot.bullets.split('\n') : []).map((bullet, bulletIdx) => (
                        <li key={bulletIdx}>
                          <span className="bullet-indicator">•</span>
                          <span className="bullet-text">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="card-release-footer">
                      <span className="verified-by-admin">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Verified by admin
                      </span>
                      <button
                        className="btn-card-download"
                        onClick={() => {
                          if (bot.download_url) {
                            window.open(bot.download_url, '_blank');
                          } else {
                            alert(`Downloading: ${bot.title}...`);
                          }
                        }}
                      >
                        <svg className="download-btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Settings presets sub-tab view
              <div className="bots-releases-grid">
                {bots.filter(b => b.type === 'setting').map((setting, index) => (
                  <div
                    key={setting.id}
                    className="bot-release-card card-animate"
                    style={{ '--index': index }}
                  >
                    <div className="card-top-header">
                      <div className="bot-icon-badge settings-badge-color">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                      </div>
                      <div className="card-bot-meta">
                        <h3 className="card-bot-title">{setting.title}</h3>
                        <span className="card-bot-subtitle">{setting.subtext}</span>
                      </div>
                      <span className="ready-pill settings-pill">{setting.badge}</span>
                    </div>

                    <ul className="bot-release-bullets">
                      {(setting.bullets ? setting.bullets.split('\n') : []).map((bullet, bulletIdx) => (
                        <li key={bulletIdx}>
                          <span className="bullet-indicator">•</span>
                          <span className="bullet-text">{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="card-release-footer">
                      <span className="verified-by-admin">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Optimized
                      </span>
                      <button
                        className="btn-card-download"
                        onClick={() => {
                          if (setting.download_url) {
                            window.open(setting.download_url, '_blank');
                          } else {
                            alert(`Downloading setfile: ${setting.title}...`);
                          }
                        }}
                      >
                        <svg className="download-btn-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
                        </svg>
                        Download Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="panel-tab">
            <h2 className="panel-title">My Subscriptions</h2>
            <p className="panel-subtitle">View your active billing plans and simulated payment history</p>

            <div className="dashboard-card-box">
              {licenses.length > 0 ? (
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Plan Description</th>
                      <th>Expiry Date</th>
                      <th>License Key</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((lic) => (
                      <tr key={lic.id}>
                        <td>SuperTradingEA License Key</td>
                        <td>{new Date(lic.expiry_date).toLocaleDateString()}</td>
                        <td><code>{lic.key.substring(0, 12)}...</code></td>
                        <td>
                          <span className={`status-cell ${lic.is_active ? 'active' : 'disabled'}`}>
                            {lic.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <h3>No Billing Logs Found</h3>
                  <p>You have no active subscription plans.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Support Button in Bottom-Right Corner */}
        <button className="support-bot-btn" onClick={() => alert('Support chatbot opening soon!')}>
          <svg className="support-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
          Support Bot
        </button>

        {/* Generate Key Modal */}
        {isGenerateModalOpen && (
          <div className="profile-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="profile-modal-card" style={{ maxWidth: '450px' }}>
              <div className="profile-modal-header">
                <div className="modal-title-group">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L14 9M18.5 4.5l-1.5 1.5"></path>
                  </svg>
                  <h3>Generate License Key</h3>
                </div>
                <button className="btn-modal-close" onClick={() => setIsGenerateModalOpen(false)} aria-label="Close modal">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="profile-modal-body">
                <form onSubmit={handleGenerateKey} className="mt5-config-form">
                  <p className="form-description">
                    Generate a new trading license key. Once created, you can copy the key and bind it to your MT5 account.
                  </p>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label" htmlFor="expiry-select">License Duration</label>
                    <select
                      id="expiry-select"
                      className="form-input select-input"
                      value={generateMonths}
                      onChange={(e) => setGenerateMonths(parseInt(e.target.value))}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px', borderRadius: '6px' }}
                    >
                      <option value="1">1 Month (Trial/Standard)</option>
                      <option value="3">3 Months (Standard)</option>
                      <option value="6">6 Months (Premium)</option>
                      <option value="12">12 Months (Professional)</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsGenerateModalOpen(false)}
                      disabled={isGenerating}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isGenerating}>
                      {isGenerating ? 'Generating...' : 'Generate Key'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
