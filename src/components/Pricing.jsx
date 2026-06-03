import React from 'react';

export default function Pricing({ onNavigate }) {
  const plans = [
    {
      id: '1month',
      name: 'Starter Plan',
      period: '1 Month',
      price: '10',
      pricePeriod: '/month',
      summary: 'Ideal for trying out SuperTradingEA on a demo or live account.',
      accounts: '1 Authorized Account',
      features: [
        'Full Access to all SuperTradingEA features',
        'Optimized for XAUUSD M1 Strategy',
        'Smart Martingale Recovery Engine',
        'Live Dashboard & Volatility Protection',
        'Standard Support & Updates',
      ],
      isPopular: false,
      isBestValue: false,
    },
    {
      id: '3months',
      name: 'Quarterly Plan',
      period: '3 Months',
      price: '25',
      pricePeriod: '/3 months',
      summary: 'Great for short-term trading goals and strategy validation.',
      accounts: '3 Authorized Accounts',
      savings: 'Save $5',
      features: [
        'Full Access to all SuperTradingEA features',
        'Optimized for XAUUSD M1 Strategy',
        'Smart Martingale Recovery Engine',
        'Live Dashboard & Volatility Protection',
        'Standard Support & Updates',
      ],
      isPopular: true,
      isBestValue: false,
    },
    {
      id: '6months',
      name: 'Semi-Annual Plan',
      period: '6 Months',
      price: '50',
      pricePeriod: '/6 months',
      summary: 'Mid-term solution for consistent automated traders.',
      accounts: '5 Authorized Accounts',
      savings: 'Save $10',
      features: [
        'Full Access to all SuperTradingEA features',
        'Optimized for XAUUSD M1 Strategy',
        'Smart Martingale Recovery Engine',
        'Live Dashboard & Volatility Protection',
        'Priority Support & Updates',
      ],
      isPopular: false,
      isBestValue: false,
    },
    {
      id: '1year',
      name: 'Annual Plan',
      period: '1 Year',
      price: '80',
      pricePeriod: '/year',
      summary: 'Best value for professional, long-term automated trading.',
      accounts: '10 Authorized Accounts',
      savings: 'Save $40 — Get 4 months FREE',
      features: [
        'Full Access to all SuperTradingEA features',
        'Optimized for XAUUSD M1 Strategy',
        'Smart Martingale Recovery Engine',
        'Live Dashboard & Volatility Protection',
        '10 Authorized Accounts',
        'VIP Priority Support & Ongoing Updates',
        'Optimized Set Files & Configuration Guide',
      ],
      isPopular: false,
      isBestValue: true,
    }
  ];

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-header">
        <h2 className="pricing-title">Choose Your License Plan</h2>
        <p className="pricing-subtitle">
          Professional XAUUSD automation bot with secure licensing, ongoing updates, and dedicated support.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="pricing-grid-4col">
        {plans.map((plan) => {
          const isHighlight = plan.isBestValue;
          const cardClass = `pricing-card ${isHighlight ? 'yearly-card focused-card' : ''} ${plan.isPopular ? 'popular-card' : ''}`;
          
          return (
            <div key={plan.id} className={cardClass}>
              {isHighlight && <span className="recommended-badge">Recommended</span>}
              {plan.isPopular && <span className="recommended-badge" style={{ backgroundColor: 'var(--primary)', color: '#000', boxShadow: '0 2px 8px rgba(0, 240, 255, 0.45)' }}>Popular</span>}
              
              <div className="card-header-plan">
                <h3 className="plan-name" style={isHighlight ? { color: 'var(--secondary)' } : plan.isPopular ? { color: 'var(--primary)' } : {}}>
                  {plan.name}
                </h3>
                <p className="plan-summary">{plan.summary}</p>
              </div>
              
              <div className="price-container">
                <span className="price-currency" style={isHighlight ? { color: 'var(--secondary)' } : {}}>$</span>
                <span className="price-amount" style={isHighlight ? { color: 'var(--secondary)' } : {}}>{plan.price}</span>
                <span className="price-period">{plan.pricePeriod}</span>
              </div>

              {plan.savings && (
                <div className="highlighted-feature" style={{ marginBottom: '20px', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                  <span className="gift-emoji" style={{ marginRight: '6px' }}>🎁</span>
                  <span><strong>{plan.savings}</strong></span>
                </div>
              )}

              <ul className="plan-features" style={{ flex: 1 }}>
                <li style={{ fontWeight: 'bold', color: 'var(--text-white)' }}>
                  <svg className="check-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={isHighlight ? "var(--secondary)" : "var(--primary)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{plan.accounts}</span>
                </li>
                {plan.features.map((feat, index) => (
                  <li key={index}>
                    <svg className="check-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={isHighlight ? "var(--secondary)" : "var(--primary)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button className={`btn-card-action ${isHighlight ? 'btn-filled' : ''}`} style={{ marginTop: '24px' }} onClick={() => onNavigate('login')}>
                Get Started
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="btn-arrow">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* VPS Banner */}
      <div className="vps-banner" style={{ marginTop: '40px' }}>
        <h4 className="vps-title">Additional Service</h4>
        <p className="vps-desc">Maximize your trading performance with our optimized VPS solution.</p>
      </div>
    </section>
  );
}
