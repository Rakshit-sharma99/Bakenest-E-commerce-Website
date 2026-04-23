import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import './ShopByCategory.css';
import { SHOP_CATEGORIES } from '../constants/categories';
import { api } from '../services/api';

const ShopByCategory = forwardRef(({ onSelect }, ref) => {
  const [hovered, setHovered] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoryStats, setCategoryStats] = useState({});
  const inputRef = useRef(null);
  const formRef = useRef(null);

  // Expose focus function to ref
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }));

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const filtered = SHOP_CATEGORIES.filter(cat => 
        cat.label.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Find exact or closest match
      const match = SHOP_CATEGORIES.find(cat => 
        cat.label.toLowerCase() === searchQuery.toLowerCase()
      ) || suggestions[0] || { id: 'all', label: `Search results for "${searchQuery}"` };
      
      onSelect({ id: match.id, label: match.label });
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (cat) => {
    setSearchQuery(cat.label);
    onSelect({ id: cat.id, label: cat.label });
    setShowSuggestions(false);
  };

  // Fetch Category Stats
  useEffect(() => {
    api.request('/products/stats/categories')
      .then(setCategoryStats)
      .catch(err => console.error('Failed to load category stats:', err));
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Use formRef to check if click was inside the search area (input + dropdown)
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section className="shopCat" id="shop-by-category" aria-label="Shop by category">
      {/* Section header */}
      <div className="shopCatHeader">
        <div className="shopCatEyebrow">
          <span className="shopCatLine" aria-hidden="true" />
          Shop by Category
          <span className="shopCatLine" aria-hidden="true" />
        </div>
        <h2 className="shopCatTitle">Find What You Need</h2>
        
        {/* Search Bar Section */}
        <div className="shopSearchWrapper">
          <form className="shopSearchForm" onSubmit={handleSearchSubmit} ref={formRef}>
            <div className="shopSearchInputGroup">
              <svg className="shopSearchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="shopSearchInput"
                placeholder="Search for baking tools, pans, whisks..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim() && suggestions.length > 0 && setShowSuggestions(true)}
              />
              <button type="submit" className="shopSearchBtn">Search</button>
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="shopSearchSuggestions">
                {suggestions.map((cat) => (
                  <li key={cat.id} className="suggestionItem" onClick={() => handleSuggestionClick(cat)}>
                    <div className="suggestionIcon" style={{ color: cat.accent }}>
                      {cat.icon}
                    </div>
                    <div className="suggestionText">
                      <span className="suggestionLabel">{cat.label}</span>
                      <span className="suggestionTag">{cat.tagline}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>

        <p className="shopCatSubtitle">Browse our full range of baking tools &amp; essentials</p>
      </div>

      {/* Grid */}
      <div className="shopCatGrid">
        {SHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`cat-${cat.id}`}
            className={`shopCatCard ${hovered === cat.id ? 'hovered' : ''}`}
            style={{ background: cat.bg }}
            onMouseEnter={() => setHovered(cat.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect({ id: cat.id, label: cat.label })}
            aria-label={`Browse ${cat.label}`}
          >
            {/* Icon */}
            <div className="shopCatIcon" style={{ color: cat.accent }}>
              {cat.icon}
            </div>

            {/* Text */}
            <div className="shopCatInfo">
              <h3 className="shopCatName">{cat.label}</h3>
              <p className="shopCatTagline">{cat.tagline}</p>
              <span className="shopCatCount" style={{ color: cat.accent }}>
                {categoryStats[cat.id] || 0} items
              </span>
            </div>

            {/* Arrow */}
            <div className="shopCatArrow" style={{ color: cat.accent }} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>

            {/* Hover shimmer */}
            <div className="shopCatShimmer" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* View all link */}
      <div className="shopCatFooter">
        <button className="shopCatViewAll" id="cat-view-all" onClick={() => onSelect({ id: 'all', label: 'All Products' })}>
          View All Products
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
});

export default ShopByCategory;
