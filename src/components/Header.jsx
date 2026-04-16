import { useState } from 'react';
import './Header.css';

const NAV_ITEMS = ['Home', 'Shop', 'Categories', 'About'];

export default function Header({ user, onAuthOpen, onSearchClick, onNavClick, onCartClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClick = (e, item) => {
    if (onNavClick && (item === 'Shop' || item === 'Categories' || item === 'Home')) {
      e.preventDefault();
      onNavClick(item);
      setMobileOpen(false);
    }
  };

  return (
    <header className="header" role="banner">
      <div className="headerInner">
        <nav className={`nav ${mobileOpen ? 'navOpen' : ''}`} role="navigation">
          {NAV_ITEMS.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="navLink" onClick={(e) => handleClick(e, item)}>
              {item}
            </a>
          ))}
        </nav>

        <a href="/" className="logo" onClick={(e) => handleClick(e, 'Home')}>
          BAKENESS 
          <span className="logoAccent">EST. 2026</span>
        </a>

        <div className="actions">
          <button className="iconButton" onClick={onSearchClick} aria-label="Search">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </button>

          <button className={`iconButton ${user ? 'userActive' : ''}`} onClick={onAuthOpen} aria-label="Account">
            {user ? (
              <div className="userInitials">{user.name.charAt(0).toUpperCase()}</div>
            ) : (
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            )}
            {user && <span className="presenceIndicator" />}
          </button>

          <button className="iconButton" aria-label="Cart" onClick={onCartClick}>
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
          </button>

          <button className="mobileToggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}
