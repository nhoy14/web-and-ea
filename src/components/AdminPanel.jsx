import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

export default function AdminPanel({ onNavigate, token, userEmail, onLogout }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'licenses'
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Search Filters
  const [userSearch, setUserSearch] = useState('');
  const [licenseSearch, setLicenseSearch] = useState('');
  
  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Action targets
  const [targetUser, setTargetUser] = useState(null);
  const [targetLicense, setTargetLicense] = useState(null);
  
  // Form fields
  const [genUserId, setGenUserId] = useState('');
  const [genExpiryMonths, setGenExpiryMonths] = useState(12);
  const [genCustomKey, setGenCustomKey] = useState('');
  const [extendMonths, setExtendMonths] = useState(3);

  // Bots releases state
  const [bots, setBots] = useState([]);
  const [showAddBotModal, setShowAddBotModal] = useState(false);
  const [editingBot, setEditingBot] = useState(null);
  const [botTitle, setBotTitle] = useState('');
  const [botSubtext, setBotSubtext] = useState('');
  const [botBadge, setBotBadge] = useState('Ready');
  const [botBullets, setBotBullets] = useState('');
  const [botType, setBotType] = useState('bot');
  const [botDownloadUrl, setBotDownloadUrl] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrorMsg(err.message || 'Failed to load users list.');
    }
  };

  // Fetch all licenses
  const fetchLicenses = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/admin/licenses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      const data = await response.json();
      setLicenses(data);
    } catch (err) {
      console.error('Error fetching licenses:', err);
      setErrorMsg(err.message || 'Failed to load licenses list.');
    }
  };

  // Helper to parse error details
  const getErrorDetail = async (response) => {
    try {
      const errData = await response.json();
      return errData.detail || 'Request failed';
    } catch (e) {
      return response.statusText || 'Request failed';
    }
  };

  // Fetch all bots
  const fetchBots = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/bots');
      if (response.ok) {
        const data = await response.json();
        setBots(data);
      }
    } catch (err) {
      console.error('Error fetching bots:', err);
    }
  };

  // Initial load
  useEffect(() => {
    if (token) {
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchLicenses(), fetchBots()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [token]);

  // Refresh lists
  const handleRefresh = () => {
    setIsLoading(true);
    setErrorMsg('');
    Promise.all([fetchUsers(), fetchLicenses(), fetchBots()]).finally(() => {
      setIsLoading(false);
    });
  };

  // Toggle active status
  const handleToggleActive = async (licenseId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/licenses/${licenseId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      await fetchLicenses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Generate License Modal
  const openGenerateModal = (user = null) => {
    if (user) {
      setGenUserId(user.id);
      setTargetUser(user);
    } else {
      setGenUserId(users[0]?.id || '');
      setTargetUser(users[0] || null);
    }
    setGenExpiryMonths(12);
    setGenCustomKey('');
    setShowGenerateModal(true);
  };

  // Submit Generate License
  const handleGenerateLicenseSubmit = async (e) => {
    e.preventDefault();
    if (!genUserId) {
      alert('Please select a target user.');
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/admin/licenses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(genUserId, 10),
          expiry_months: parseInt(genExpiryMonths, 10),
          custom_key: genCustomKey ? genCustomKey.trim() : null
        })
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      alert('License generated successfully!');
      setShowGenerateModal(false);
      await fetchLicenses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Extend License Modal
  const openExtendModal = (lic) => {
    setTargetLicense(lic);
    setExtendMonths(3);
    setShowExtendModal(true);
  };

  // Submit Extend License
  const handleExtendLicenseSubmit = async (e) => {
    e.preventDefault();
    if (!targetLicense) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/licenses/${targetLicense.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          months: parseInt(extendMonths, 10)
        })
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      alert('License expiration extended successfully!');
      setShowExtendModal(false);
      await fetchLicenses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Delete License Modal
  const openDeleteModal = (lic) => {
    setTargetLicense(lic);
    setShowDeleteModal(true);
  };

  // Submit Delete License
  const handleDeleteLicenseSubmit = async () => {
    if (!targetLicense) return;
    try {
      const response = await fetch(`http://localhost:8000/api/admin/licenses/${targetLicense.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      alert('License deleted successfully!');
      setShowDeleteModal(false);
      await fetchLicenses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Bot Release Handlers
  const handleAddBotSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/admin/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: botTitle,
          subtext: botSubtext,
          badge: botBadge,
          bullets: botBullets,
          type: botType,
          download_url: botDownloadUrl || null
        })
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      alert('Bot/Setting release added successfully!');
      setShowAddBotModal(false);
      // Reset form fields
      setBotTitle('');
      setBotSubtext('');
      setBotBullets('');
      setBotDownloadUrl('');
      setBotType('bot');
      setBotBadge('Ready');
      await fetchBots();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm('Are you sure you want to permanently delete this release/preset?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/admin/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(await getErrorDetail(response));
      }
      alert('Release/Preset deleted successfully!');
      await fetchBots();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.toString() === userSearch
  );

  // Filtered Licenses List
  const filteredLicenses = licenses.filter(l => 
    l.key.toLowerCase().includes(licenseSearch.toLowerCase()) ||
    l.user_email.toLowerCase().includes(licenseSearch.toLowerCase()) ||
    (l.assigned_account && l.assigned_account.includes(licenseSearch))
  );

  // Helper to determine expiry status
  const getExpiryStatus = (expiryDateStr) => {
    const exp = new Date(expiryDateStr);
    const now = new Date();
    if (exp < now) return 'expired';
    
    // Check if within 30 days
    const diffTime = Math.abs(exp - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return 'warning';
    
    return 'good';
  };

  // Totals for top statistics widgets
  const stats = {
    totalUsers: users.length,
    totalLicenses: licenses.length,
    activeLicenses: licenses.filter(l => l.is_active).length,
    expiredLicenses: licenses.filter(l => new Date(l.expiry_date) < new Date()).length
  };

  return (
    <div className="admin-dashboard-container">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <svg className="logo-icon" viewBox="0 0 40 40" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2L35 10V22C35 30.5 28.5 36.5 20 38C11.5 36.5 5 30.5 5 22V10L20 2Z" stroke="var(--secondary)" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M12 15L16 19L20 13L24 19L28 15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 23V31" stroke="var(--secondary)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="20" cy="20" r="1.5" fill="var(--secondary)"/>
          </svg>
          <div className="admin-brand-texts">
            <span className="admin-brand-title">Admin Portal</span>
            <span className="admin-brand-subtitle">EA Licensing</span>
          </div>
        </div>

        <nav className="admin-sidebar-menu">
          <button 
            className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <svg className="admin-menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Users Management
          </button>
          
          <button 
            className={`admin-menu-item ${activeTab === 'licenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('licenses')}
          >
            <svg className="admin-menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Licenses Management
          </button>

          <button 
            className={`admin-menu-item ${activeTab === 'bots' ? 'active' : ''}`}
            onClick={() => setActiveTab('bots')}
          >
            <svg className="admin-menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2"></rect>
              <path d="M12 2v9M8 5h8"></path>
            </svg>
            Bots & Settings Management
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-back-btn" onClick={() => onNavigate('dashboard')}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to User Portal
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="admin-content-area">
        {/* Top Header */}
        <div className="admin-panel-header">
          <span className="admin-badge">
            <span className="dot"></span>
            Secured Area
          </span>
          <h2 className="admin-panel-title">
            {activeTab === 'users' ? 'Registered Platform Users' : activeTab === 'licenses' ? 'Landed License Keys' : 'Manage EA Bots & Settings'}
          </h2>
          <p className="admin-panel-subtitle">
            Logged in as administrator: <span style={{ color: '#fff', fontWeight: 600 }}>{userEmail}</span>
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Stats counters */}
        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stats.totalUsers}</span>
              <span className="admin-stat-label">Total Users</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrapper" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stats.activeLicenses} / {stats.totalLicenses}</span>
              <span className="admin-stat-label">Active Licenses</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrapper secondary-color">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stats.expiredLicenses}</span>
              <span className="admin-stat-label">Expired Licenses</span>
            </div>
          </div>
        </div>

        {/* Active Tab View: Users */}
        {activeTab === 'users' && (
          <>
            <div className="admin-controls-row">
              <div className="admin-search-wrapper">
                <svg className="admin-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="Search users by email or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="admin-action-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', boxShadow: 'none' }} onClick={handleRefresh}>
                  Refresh
                </button>
                <button className="admin-action-btn" onClick={() => openGenerateModal(null)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Generate Key
                </button>
              </div>
            </div>

            <div className="admin-card-box">
              {isLoading ? (
                <div className="admin-empty-state">
                  <h3>Loading Users...</h3>
                  <p>Fetching registers from the licensing database.</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Email Address</th>
                        <th>Joined Date</th>
                        <th>User Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td><code>#{u.id}</code></td>
                          <td><span className="email-txt">{u.email}</span></td>
                          <td>{new Date(u.created_at).toLocaleString()}</td>
                          <td>
                            <span className={u.is_admin ? 'admin-pill' : 'user-pill'}>
                              {u.is_admin ? 'ADMIN' : 'USER'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="admin-back-btn" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px', display: 'inline-flex' }}
                              onClick={() => openGenerateModal(u)}
                            >
                              Generate Key
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">
                  <h3>No Users Match Search</h3>
                  <p>Try matching with another email address or user ID.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Active Tab View: Licenses */}
        {activeTab === 'licenses' && (
          <>
            <div className="admin-controls-row">
              <div className="admin-search-wrapper">
                <svg className="admin-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="Search by key, owner email, or MT5..."
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="admin-action-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', boxShadow: 'none' }} onClick={handleRefresh}>
                  Refresh
                </button>
                <button className="admin-action-btn" onClick={() => openGenerateModal(null)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Generate Key
                </button>
              </div>
            </div>

            <div className="admin-card-box">
              {isLoading ? (
                <div className="admin-empty-state">
                  <h3>Loading Licenses...</h3>
                  <p>Fetching EA keys from the database.</p>
                </div>
              ) : filteredLicenses.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>License Key</th>
                        <th>Owner Email</th>
                        <th>Bound MT5</th>
                        <th>Expiration Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLicenses.map((lic) => {
                        const isExpired = new Date(lic.expiry_date) < new Date();
                        const expiryState = getExpiryStatus(lic.expiry_date);
                        
                        return (
                          <tr key={lic.id}>
                            <td>
                              <span className="code-key">{lic.key}</span>
                              <button 
                                style={{ background: 'transparent', border: 'none', marginLeft: '6px', cursor: 'pointer', color: 'var(--primary)' }}
                                onClick={() => {
                                  navigator.clipboard.writeText(lic.key);
                                  alert('Key copied!');
                                }}
                                title="Copy Key"
                              >
                                📋
                              </button>
                            </td>
                            <td><span className="email-txt">{lic.user_email}</span> <span className="secondary-badge">#{lic.user_id}</span></td>
                            <td>
                              {lic.assigned_account ? (
                                <span style={{ color: '#fff', fontWeight: 600 }}>{lic.assigned_account}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending bind</span>
                              )}
                            </td>
                            <td>
                              <span style={{ 
                                color: expiryState === 'expired' ? '#ef4444' : expiryState === 'warning' ? '#f59e0b' : '#fff',
                                fontWeight: expiryState !== 'good' ? 'bold' : 'normal'
                              }}>
                                {new Date(lic.expiry_date).toLocaleDateString()} {new Date(lic.expiry_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </td>
                            <td>
                              <span className={`status-indicator ${isExpired ? 'expired' : lic.is_active ? 'active' : 'disabled'}`}>
                                <span className="status-dot"></span>
                                {isExpired ? 'EXPIRED' : lic.is_active ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                <button 
                                  className="table-btn toggle-btn"
                                  onClick={() => handleToggleActive(lic.id)}
                                  title={lic.is_active ? "Disable License" : "Enable License"}
                                >
                                  {lic.is_active ? (
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                      <line x1="9" y1="9" x2="15" y2="15"></line>
                                      <line x1="15" y1="9" x2="9" y2="15"></line>
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </button>
                                
                                <button 
                                  className="table-btn extend-btn"
                                  onClick={() => openExtendModal(lic)}
                                  title="Extend Expiry Date"
                                >
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                </button>

                                <button 
                                  className="table-btn delete-btn"
                                  onClick={() => openDeleteModal(lic)}
                                  title="Delete License"
                                >
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">
                  <h3>No Licenses Found</h3>
                  <p>Try searching for a different user email or license key.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Active Tab View: Bots & Settings */}
        {activeTab === 'bots' && (
          <>
            <div className="admin-controls-row">
              <div className="admin-search-wrapper">
                <svg className="admin-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="Search bots or settings by title..."
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="admin-action-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', boxShadow: 'none' }} onClick={handleRefresh}>
                  Refresh
                </button>
                <button className="admin-action-btn" onClick={() => {
                  setBotTitle('');
                  setBotSubtext('');
                  setBotBullets('');
                  setBotDownloadUrl('');
                  setBotType('bot');
                  setBotBadge('Ready');
                  setShowAddBotModal(true);
                }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Bot/Setting
                </button>
              </div>
            </div>

            <div className="admin-card-box">
              {isLoading ? (
                <div className="admin-empty-state">
                  <h3>Loading Releases...</h3>
                  <p>Fetching bot releases and settings from the database.</p>
                </div>
              ) : bots.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Badge</th>
                        <th>Subtext</th>
                        <th>Download URL</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bots.filter(b => b.title.toLowerCase().includes(licenseSearch.toLowerCase())).map((b) => (
                        <tr key={b.id}>
                          <td><code>#{b.id}</code></td>
                          <td><span style={{ color: '#fff', fontWeight: 600 }}>{b.title}</span></td>
                          <td>
                            <span className={b.type === 'bot' ? 'admin-pill' : 'user-pill'} style={{ backgroundColor: b.type === 'bot' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: b.type === 'bot' ? 'var(--primary)' : '#f59e0b' }}>
                              {b.type.toUpperCase()}
                            </span>
                          </td>
                          <td><span className="secondary-badge">{b.badge}</span></td>
                          <td><span className="email-txt">{b.subtext || '-'}</span></td>
                          <td><code style={{ fontSize: '11px' }}>{b.download_url || 'Default link'}</code></td>
                          <td>
                            <button 
                              className="table-btn delete-btn"
                              onClick={() => handleDeleteBot(b.id)}
                              title="Delete Release"
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">
                  <h3>No Bot/Setting Releases Found</h3>
                  <p>Click "Add Bot/Setting" to create your first release.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal: Generate License */}
      {showGenerateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Generate New License</h3>
              <button className="admin-modal-close-btn" onClick={() => setShowGenerateModal(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleGenerateLicenseSubmit}>
              <div className="admin-modal-body">
                {targetUser ? (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Target User Email</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      value={`${targetUser.email} (User ID: ${targetUser.id})`}
                      disabled 
                    />
                  </div>
                ) : (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Select Target User</label>
                    <select 
                      className="admin-form-select"
                      value={genUserId}
                      onChange={(e) => setGenUserId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose User --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.email} (ID: {u.id})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-form-label">License Duration (Months)</label>
                  <select 
                    className="admin-form-select"
                    value={genExpiryMonths}
                    onChange={(e) => setGenExpiryMonths(e.target.value)}
                  >
                    <option value={1}>1 Month (Standard)</option>
                    <option value={3}>3 Months (Quarterly)</option>
                    <option value={6}>6 Months (Half-Year)</option>
                    <option value={12}>12 Months (Annual)</option>
                    <option value={24}>24 Months (2-Year Plan)</option>
                    <option value={120}>120 Months (Lifetime/10y)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Custom License Key (Optional)</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="Leave empty for auto-generated (DAJ-XXXX...)"
                    value={genCustomKey}
                    onChange={(e) => setGenCustomKey(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Warning: Custom keys must be globally unique in database.
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-modal-cancel-btn" 
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-modal-submit-btn">
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Extend License Expiry */}
      {showExtendModal && targetLicense && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Extend License Key</h3>
              <button className="admin-modal-close-btn" onClick={() => setShowExtendModal(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleExtendLicenseSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">License Key</label>
                  <input type="text" className="admin-form-input" value={targetLicense.key} disabled />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Current Expiration</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={new Date(targetLicense.expiry_date).toLocaleString()} 
                    disabled 
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Extension Duration (Months)</label>
                  <select 
                    className="admin-form-select"
                    value={extendMonths}
                    onChange={(e) => setExtendMonths(e.target.value)}
                  >
                    <option value={1}>+1 Month</option>
                    <option value={3}>+3 Months</option>
                    <option value={6}>+6 Months</option>
                    <option value={12}>+12 Months (1 Year)</option>
                    <option value={24}>+24 Months (2 Years)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-modal-cancel-btn" 
                  onClick={() => setShowExtendModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-modal-submit-btn" style={{ background: '#f59e0b', color: '#000', boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)' }}>
                  Extend Expiration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete License */}
      {showDeleteModal && targetLicense && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="admin-modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <h3 className="admin-modal-title" style={{ color: '#ef4444' }}>Delete License Key?</h3>
              <button className="admin-modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="admin-modal-body">
              <p style={{ color: '#fff', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete the license key <code style={{ color: 'var(--primary)' }}>{targetLicense.key}</code>?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', lineHeight: 1.5 }}>
                This will revoke MT5 EA software access immediately for user <strong style={{ color: '#fff' }}>{targetLicense.user_email}</strong>. This action is irreversible.
              </p>
            </div>

            <div className="admin-modal-footer" style={{ borderTop: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <button 
                type="button" 
                className="admin-modal-cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="admin-modal-submit-btn danger" 
                onClick={handleDeleteLicenseSubmit}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Bot/Setting Release */}
      {showAddBotModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Add Bot / Setting Release</h3>
              <button className="admin-modal-close-btn" onClick={() => setShowAddBotModal(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddBotSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Type</label>
                  <select 
                    className="admin-form-select"
                    value={botType}
                    onChange={(e) => {
                      setBotType(e.target.value);
                      setBotBadge(e.target.value === 'bot' ? 'Ready' : 'Setfile');
                    }}
                    required
                  >
                    <option value="bot">EA Bot Release</option>
                    <option value="setting">Settings Preset (.setfile)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Title</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="e.g. SuperTradingEA V2.2.3"
                    value={botTitle}
                    onChange={(e) => setBotTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Subtext / Short Description</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="e.g. News Filter & Breakeven Exit Mode"
                    value={botSubtext}
                    onChange={(e) => setBotSubtext(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Badge Label</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="e.g. Ready, Beta, Setfile, etc."
                    value={botBadge}
                    onChange={(e) => setBotBadge(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Bullet points (one per line)</label>
                  <textarea 
                    className="admin-form-input" 
                    placeholder="News filter enabled&#10;ATR percentile index: 1.5x"
                    style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', padding: '10px' }}
                    value={botBullets}
                    onChange={(e) => setBotBullets(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Download URL (Optional)</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="Link to file, leave empty for default placeholder"
                    value={botDownloadUrl}
                    onChange={(e) => setBotDownloadUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-modal-cancel-btn" 
                  onClick={() => setShowAddBotModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-modal-submit-btn">
                  Publish Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
