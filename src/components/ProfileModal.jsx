import React, { useState } from 'react';

export default function ProfileModal({ onClose, userEmail, mt5Account, onUpdateMt5 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [accountId, setAccountId] = useState(mt5Account.accountId);
  const [server, setServer] = useState(mt5Account.server);
  const [password, setPassword] = useState('••••••••');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = (e) => {
    e.preventDefault();
    if (!accountId) {
      alert('Please enter an MT5 Account ID.');
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate API connection verification to Metatrader 5
    setTimeout(() => {
      setIsConnecting(false);
      setIsEditing(false);
      
      // Calculate random realistic balance/equity based on account ID length
      const seed = parseInt(accountId) || 50000;
      const baseBalance = (seed % 90000) + 5000;
      const mockBalance = parseFloat(baseBalance.toFixed(2));
      const mockEquity = parseFloat((mockBalance + (seed % 100) - 40).toFixed(2));
      
      // Generate randomized mock P&L statistics
      const dayG = parseFloat(((seed % 150) - 40).toFixed(2));
      const weekG = parseFloat(((seed % 600) - 100).toFixed(2));
      const monthG = parseFloat(((seed % 2500) - 200).toFixed(2));
      const yearG = parseFloat(((seed % 18000) + 1200).toFixed(2));

      onUpdateMt5({
        accountId,
        server,
        balance: mockBalance,
        equity: mockEquity,
        pnl: {
          day: dayG,
          dayPct: parseFloat(((dayG / mockBalance) * 100).toFixed(2)),
          week: weekG,
          weekPct: parseFloat(((weekG / mockBalance) * 100).toFixed(2)),
          month: monthG,
          monthPct: parseFloat(((monthG / mockBalance) * 100).toFixed(2)),
          year: yearG,
          yearPct: parseFloat(((yearG / mockBalance) * 100).toFixed(2))
        }
      });
    }, 1200);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatPercent = (val) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val}%`;
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal-card">
        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="modal-title-group">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <h3>Trader Profile & MT5 Account</h3>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="profile-modal-body">
          
          {/* User Account Info Section */}
          <div className="modal-section user-meta-info">
            <div className="avatar-large">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="meta-details">
              <h4>{userEmail}</h4>
              <span className="badge-role">Verified EA Trader</span>
            </div>
          </div>

          <hr className="modal-divider" />

          {/* MT5 Account Details / Edit Panel */}
          {isEditing ? (
            <form onSubmit={handleConnect} className="mt5-config-form">
              <h4 className="section-title">Link MetaTrader 5 Account</h4>
              <p className="form-description">
                Enter your MT5 server and login ID. We establish a secure connection using read-only terminal queries to update EAs.
              </p>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="mt5-id-input">MT5 Account ID</label>
                  <input
                    id="mt5-id-input"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 8894021"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mt5-server-select">Broker Server</label>
                  <select
                    id="mt5-server-select"
                    className="form-input select-input"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                  >
                    <option value="SuperTradingEA-Live">SuperTradingEA-Live</option>
                    <option value="MetaQuotes-Demo">MetaQuotes-Demo</option>
                    <option value="ICMarkets-MT5-Live">ICMarkets-MT5-Live</option>
                    <option value="FTMO-Demo-MT5">FTMO-Demo-MT5</option>
                  </select>
                </div>

                <div className="form-group span-2">
                  <label className="form-label" htmlFor="mt5-pwd-input">MT5 Investor Password (Read-Only)</label>
                  <input
                    id="mt5-pwd-input"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsEditing(false)}
                  disabled={isConnecting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Connecting terminal...
                    </>
                  ) : (
                    'Connect Account'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt5-active-panel">
              <div className="panel-header-row">
                <h4 className="section-title">MetaTrader 5 Connection</h4>
                <button className="btn-edit-connection" onClick={() => setIsEditing(true)}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Link Account
                </button>
              </div>

              {/* Glowing Card for MT5 Status */}
              <div className="mt5-connection-card">
                <div className="card-bg-grid"></div>
                <div className="card-top-row">
                  <div className="card-status-badge">
                    <span className="status-dot-green"></span>
                    MT5 Terminal Connected
                  </div>
                  <div className="broker-logo">MT5</div>
                </div>

                <div className="card-mid-row">
                  <div className="acc-label">ACCOUNT ID</div>
                  <div className="acc-number">{mt5Account.accountId}</div>
                  <div className="acc-server">{mt5Account.server}</div>
                </div>

                <div className="card-bottom-grid">
                  <div className="stat-box">
                    <span className="stat-label">BALANCE</span>
                    <span className="stat-val">{formatCurrency(mt5Account.balance)}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">EQUITY</span>
                    <span className="stat-val accent-equity">{formatCurrency(mt5Account.equity)}</span>
                  </div>
                </div>
              </div>

              {/* Profit & Loss Grid (1 Day, 1 Week, 1 Month, 1 Year) */}
              <div className="pnl-statistics-section">
                <h4 className="section-title">Real-Time Performance Overview</h4>
                <div className="pnl-grid">
                  
                  {/* 1 Day */}
                  <div className={`pnl-card ${mt5Account.pnl.day >= 0 ? 'pos' : 'neg'}`}>
                    <div className="pnl-label">1 Day Return</div>
                    <div className="pnl-value">
                      {formatCurrency(mt5Account.pnl.day)}
                    </div>
                    <div className="pnl-percentage">
                      {formatPercent(mt5Account.pnl.dayPct)}
                    </div>
                  </div>

                  {/* 1 Week */}
                  <div className={`pnl-card ${mt5Account.pnl.week >= 0 ? 'pos' : 'neg'}`}>
                    <div className="pnl-label">1 Week Return</div>
                    <div className="pnl-value">
                      {formatCurrency(mt5Account.pnl.week)}
                    </div>
                    <div className="pnl-percentage">
                      {formatPercent(mt5Account.pnl.weekPct)}
                    </div>
                  </div>

                  {/* 1 Month */}
                  <div className={`pnl-card ${mt5Account.pnl.month >= 0 ? 'pos' : 'neg'}`}>
                    <div className="pnl-label">1 Month Return</div>
                    <div className="pnl-value">
                      {formatCurrency(mt5Account.pnl.month)}
                    </div>
                    <div className="pnl-percentage">
                      {formatPercent(mt5Account.pnl.monthPct)}
                    </div>
                  </div>

                  {/* 1 Year */}
                  <div className={`pnl-card ${mt5Account.pnl.year >= 0 ? 'pos' : 'neg'}`}>
                    <div className="pnl-label">1 Year Return</div>
                    <div className="pnl-value">
                      {formatCurrency(mt5Account.pnl.year)}
                    </div>
                    <div className="pnl-percentage">
                      {formatPercent(mt5Account.pnl.yearPct)}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
