import React from 'react';

export default function Features() {
  return (
    <section className="features-section" id="features">
      <div className="features-header">
        <span className="features-badge">FEATURES</span>
        <h2 className="features-title">Expert Advisor Features</h2>
        <p className="features-subtitle">Professional automation engineered for Gold volatility</p>
      </div>

      <div className="features-grid">
        {/* Card 1: Risk Control (Spans 2 columns, 2 rows) */}
        <div className="feature-card risk-control-card">
          <div className="shield-icon-wrapper">
            <svg className="glowing-svg" viewBox="0 0 100 100" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 15L80 25V55C80 73.5 67 88.5 50 93C33 88.5 20 73.5 20 55V25L50 15Z" stroke="var(--primary)" strokeWidth="4" strokeLinejoin="round" fill="rgba(var(--primary-rgb), 0.02)" />
              <path d="M38 52L46 60L62 44" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="card-info">
            <h3 className="card-title">Risk Control</h3>
            <p className="card-desc">
              Built-in protection with free margin checks, spread filtering, and volatility pause. Optional equity limits and daily profit caps.
            </p>
          </div>
        </div>

        {/* Card 2: Pip Engine (Spans 1 column, 1 row) */}
        <div className="feature-card small-card">
          <div className="icon-wrapper">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="12" stroke="var(--primary)" strokeWidth="3" />
              <path d="M24 6V10M24 38V42M6 24H10M38 24H42M11.3 11.3L14.1 14.1M33.9 33.9L36.7 36.7M11.3 36.7L14.1 33.9M33.9 14.1L36.7 11.3" stroke="#8e97a4" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="card-title">Pip Engine</h3>
          <p className="card-desc">
            Dynamically adjusts trade spacing using ATR and Bollinger Bands.
          </p>
        </div>

        {/* Card 3: Take Profit (Spans 1 column, 1 row) */}
        <div className="feature-card small-card">
          <div className="icon-wrapper">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="16" stroke="#8e97a4" strokeWidth="2" />
              <circle cx="24" cy="24" r="10" stroke="var(--primary)" strokeWidth="3" />
              <circle cx="24" cy="24" r="4" fill="var(--primary)" />
              <path d="M24 2V8M24 40V46M2 24H8M40 24H46" stroke="#8e97a4" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="card-title">Take Profit</h3>
          <p className="card-desc">
            Smart basket exits with ATR smoothing for optimal timing.
          </p>
        </div>

        {/* Card 4: Martingale (Spans 2 columns, 1 row - Horizontal style, Magenta accent) */}
        <div className="feature-card martingale-card">
          <div className="martingale-icon-wrapper">
            <div className="badge-2x">2x</div>
            <svg viewBox="0 0 60 50" width="50" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="32" width="50" height="8" rx="4" stroke="#8c95a3" strokeWidth="3" />
              <rect x="10" y="20" width="40" height="8" rx="4" stroke="var(--secondary)" strokeWidth="3" fill="rgba(255, 0, 127, 0.1)" />
              <rect x="15" y="8" width="30" height="8" rx="4" stroke="#8c95a3" strokeWidth="3" />
            </svg>
          </div>
          <div className="card-info">
            <h3 className="card-title" style={{ color: 'var(--secondary)' }}>Martingale</h3>
            <p className="card-desc">
              Intelligent recovery for Gold volatility. Strategic position sizing manages drawdowns — not random averaging.
            </p>
          </div>
        </div>

        {/* Card 5: Realtime (Spans 1 column, 1 row) */}
        <div className="feature-card small-card flex-bottom-desc">
          <div className="icon-wrapper">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="6" width="40" height="28" rx="4" stroke="#8e97a4" strokeWidth="3" />
              <path d="M14 42H34M24 34V42" stroke="#8e97a4" strokeWidth="3" strokeLinecap="round" />
              <circle cx="38" cy="12" r="2" fill="var(--primary)" />
            </svg>
          </div>
          <h3 className="card-title">Realtime</h3>
          <p className="card-desc">
            Live execution and position control on every tick.
          </p>
        </div>

        {/* Card 6: High Frequency (Spans 1 column, 1 row) */}
        <div className="feature-card small-card flex-bottom-desc">
          <div className="icon-wrapper">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="16" stroke="#8e97a4" strokeWidth="3" />
              <path d="M24 14V24H34" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 2V6M24 42V46M2 24H6M42 24H46" stroke="#8e97a4" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="card-title">High Frequency</h3>
          <p className="card-desc">
            M1 timeframe optimized for fast-moving Gold sessions.
          </p>
        </div>

        {/* Card 7: Dual-Hedged Engine (Spans 1 column, 1 row) */}
        <div className="feature-card small-card flex-bottom-desc">
          <div className="icon-wrapper">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 6C14.06 6 6 14.06 6 24C6 27.56 7.04 30.88 8.82 33.68" stroke="#8e97a4" strokeWidth="3" strokeLinecap="round" />
              <path d="M24 42C33.94 42 42 33.94 42 24C42 20.44 40.96 17.12 39.18 14.32" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
              <path d="M34 14.32H39.18V19.5" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 33.68H8.82V28.5" stroke="#8e97a4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="24" r="4" stroke="#8e97a4" strokeWidth="2" />
            </svg>
          </div>
          <h3 className="card-title">Dual-Hedged Engine</h3>
          <p className="card-desc">
            Opens both buy and sell positions on every M1 candle for direction-neutral trading.
          </p>
        </div>

        {/* Card 8: Configurable Risk (Spans 1 column, 1 row) */}
        <div className="feature-card small-card flex-bottom-desc">
          <div className="icon-wrapper">
            <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 38C8 38 12 24 24 24C36 24 40 38 40 38" stroke="#8e97a4" strokeWidth="3" strokeLinecap="round" />
              <path d="M24 24L32 16" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="24" cy="24" r="3" fill="var(--primary)" />
              <path d="M6 30C9 20 15 12 24 12C33 12 39 20 42 30" stroke="#8e97a4" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
          <h3 className="card-title">Configurable Risk</h3>
          <p className="card-desc">
            Adjust risk parameters for any account size. Works from $50 / 5000 cents upward.
          </p>
        </div>
      </div>
    </section>
  );
}
