import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProfileModal from './components/ProfileModal';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || 'user@example.com');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('is_admin') === 'true');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('access_token'));
  const [currentPage, setCurrentPage] = useState(() => localStorage.getItem('access_token') ? 'dashboard' : 'home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Shared dashboard sidebar drawer state
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // MT5 Account details with balance, equity, and P&L (1 day, week, month, year)
  const [mt5Account, setMt5Account] = useState({
    accountId: '8894021',
    server: 'SuperTradingEA-Live',
    balance: 12450.00,
    equity: 12485.50,
    pnl: {
      day: 145.20,
      dayPct: 1.17,
      week: 680.50,
      weekPct: 5.78,
      month: 2150.00,
      monthPct: 20.87,
      year: 15480.00,
      yearPct: 124.30
    }
  });

  useEffect(() => {
    if (!token) return;

    const fetchMt5Data = async () => {
      try {
        const response = await fetch('/api/licenses/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Find first license with an assigned account
          const activeLic = data.find(l => l.assigned_account);
          if (activeLic) {
            const balance = activeLic.mt5_balance !== null ? activeLic.mt5_balance : 0;
            const equity = activeLic.mt5_equity !== null ? activeLic.mt5_equity : 0;
            const todayProfit = activeLic.mt5_today_profit !== null ? activeLic.mt5_today_profit : 0;
            const weeklyProfit = activeLic.mt5_weekly_profit !== null ? activeLic.mt5_weekly_profit : 0;

            setMt5Account({
              accountId: activeLic.assigned_account,
              server: activeLic.mt5_server || 'SuperTradingEA-Live',
              balance: balance,
              equity: equity,
              pnl: {
                day: todayProfit,
                dayPct: balance > 0 ? parseFloat(((todayProfit / balance) * 100).toFixed(2)) : 0,
                week: weeklyProfit,
                weekPct: balance > 0 ? parseFloat(((weeklyProfit / balance) * 100).toFixed(2)) : 0,
                month: weeklyProfit * 4.33,
                monthPct: balance > 0 ? parseFloat((((weeklyProfit * 4.33) / balance) * 100).toFixed(2)) : 0,
                year: weeklyProfit * 52,
                yearPct: balance > 0 ? parseFloat((((weeklyProfit * 52) / balance) * 100).toFixed(2)) : 0
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching MT5 stats in App:', err);
      }
    };

    // Initial load
    fetchMt5Data();

    // Auto-poll every 5 seconds for real-time dashboard updates
    const interval = setInterval(fetchMt5Data, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setIsDrawerOpen(false); // Close drawer if shifting page
    window.scrollTo(0, 0); // Reset scroll position on navigation
  };

  const handleLogin = (email, accessToken, isUserAdmin) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('user_email', email);
    localStorage.setItem('is_admin', isUserAdmin ? 'true' : 'false');
    setToken(accessToken);
    setUserEmail(email);
    setIsAdmin(!!isUserAdmin);
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('is_admin');
    setToken('');
    setUserEmail('');
    setIsAdmin(false);
    setIsLoggedIn(false);
    setShowProfileModal(false);
    setCurrentPage('home');
  };

  const handleUpdateMt5 = (newDetails) => {
    setMt5Account(newDetails);
  };

  return (
    <div className="app-container">
      {/* Unified Site Header */}
      {(currentPage === 'home' || currentPage === 'dashboard' || currentPage === 'admin') && (
        <Header 
          onNavigate={handleNavigate} 
          currentPage={currentPage} 
          isLoggedIn={isLoggedIn}
          userEmail={userEmail}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onOpenProfile={() => setShowProfileModal(true)}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        />
      )}

      <main className="main-content">
        {currentPage === 'home' && (
          <>
            <Hero onNavigate={handleNavigate} />
            <Features />
            <Pricing onNavigate={handleNavigate} />
          </>
        )}

        {currentPage === 'login' && (
          <Login onNavigate={handleNavigate} onLogin={handleLogin} />
        )}

        {currentPage === 'dashboard' && (
          <Dashboard 
            onNavigate={handleNavigate} 
            userEmail={userEmail} 
            token={token}
            isAdmin={isAdmin}
            onLogout={handleLogout} 
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPanel
            onNavigate={handleNavigate}
            token={token}
            userEmail={userEmail}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Floating MT5 Profile & P&L Statistics Modal Overlay */}
      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)}
          userEmail={userEmail}
          mt5Account={mt5Account}
          onUpdateMt5={handleUpdateMt5}
        />
      )}
    </div>
  );
}

export default App;
