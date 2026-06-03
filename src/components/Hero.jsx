import React from 'react';

export default function Hero({ onNavigate }) {
  // Generate random floating candles to simulate a volatile chart background
  const candles = [
    { id: 1, type: 'green', height: 70, top: '25%', left: '15%', delay: '0s', duration: '8s' },
    { id: 2, type: 'red', height: 90, top: '15%', left: '28%', delay: '2s', duration: '9s' },
    { id: 3, type: 'green', height: 50, top: '35%', left: '33%', delay: '4s', duration: '7s' },
    { id: 4, type: 'red', height: 110, top: '20%', left: '48%', delay: '1s', duration: '11s' },
    { id: 5, type: 'green', height: 80, top: '40%', left: '60%', delay: '3s', duration: '8.5s' },
    { id: 6, type: 'red', height: 60, top: '28%', left: '72%', delay: '5s', duration: '7.5s' },
    { id: 7, type: 'green', height: 100, top: '12%', left: '85%', delay: '0.5s', duration: '10s' },
    { id: 8, type: 'green', height: 60, top: '55%', left: '22%', delay: '3.5s', duration: '9.5s' },
    { id: 9, type: 'red', height: 75, top: '65%', left: '78%', delay: '1.5s', duration: '8s' },
  ];

  return (
    <section className="hero-section">
      {/* Volatility Background Animation */}
      <div className="candles-background">
        {candles.map((candle) => (
          <div
            key={candle.id}
            className={`candle-wick ${candle.type}`}
            style={{
              top: candle.top,
              left: candle.left,
              height: `${candle.height + 40}px`,
              animationDelay: candle.delay,
              animationDuration: candle.duration
            }}
          >
            <div 
              className="candle-body" 
              style={{ height: `${candle.height}px` }}
            />
          </div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="hero-content">
        <h2 className="hero-badge">Engineered for Gold Volatility</h2>
        <h1 className="hero-title">
          Trade XAUUSD Without <br />
          Choosing a Direction
        </h1>
        <p className="hero-subtitle">
          Fully automated dual-hedged trading system. Set it up once, let SuperTradingEA handle the rest.
        </p>
        
        <div className="hero-actions">
          <a href="#pricing" className="btn-primary">
            View Pricing 
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="btn-arrow">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
          <button className="btn-secondary" onClick={() => onNavigate('login')}>
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
}
