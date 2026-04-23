import React from 'react';
import './BigShopCTA.css';

export default function BigShopCTA({ onClick }) {
  return (
    <section className="big-cta-section">
      <div className="container">
        <button className="big-cta-card" onClick={onClick}>
          <div className="cta-content">
            <span className="cta-sub">Ready to bake?</span>
            <h2 className="cta-title">Discover Our Full Collection</h2>
            <p className="cta-text">
              Explore over 100+ professional baking tools handpicked for masters and beginners alike.
            </p>
            <div className="cta-btn-wrap">
              <span className="cta-btn">
                Visit the Shop
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </div>
          <div className="cta-visual">
            <div className="cta-circle cta-circle-1" />
            <div className="cta-circle cta-circle-2" />
          </div>
        </button>
      </div>
    </section>
  );
}
