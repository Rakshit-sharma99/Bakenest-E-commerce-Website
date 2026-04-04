import { useState, useEffect } from 'react';
import './ProductsPage.css';
import { SHOP_CATEGORIES } from '../constants/categories';

/* ── Mock product data per category ── */
const MOCK_PRODUCTS = {
  'premium-tools': [
    { id: 101, name: 'Professional Copper Stand Mixer', price: '$599.00', rating: 5.0, reviews: 42, badge: 'Premium', desc: 'Limited edition high-performance mixer with vintage copper finish.' },
    { id: 102, name: 'Handcrafted Japanese Pastry Knives', price: '$180.00', rating: 4.9, reviews: 28, badge: 'Premium', desc: 'Set of 3 precision blades for delicate dough work.' },
    { id: 103, name: 'Italian Marble Pastry Board', price: '$125.00', rating: 4.8, reviews: 56, badge: 'Premium', desc: 'Heavily weighted Carrara marble keeps dough cool naturally.' },
    { id: 104, name: 'Digital Precision Baking Scale', price: '$85.00', rating: 4.9, reviews: 112, badge: 'Premium', desc: 'Accurate to 0.01g for consistent professional results.' },
  ],
  'bakers-favorites': [
    { id: 201, name: 'Artisan Sourdough Starter Kit', price: '$45.00', rating: 4.7, reviews: 890, badge: 'Best Seller', desc: 'Everything needed to start your sourdough journey.' },
    { id: 202, name: 'Pro-Grade Silicone Baking Mats', price: '$32.00', rating: 4.9, reviews: 1240, badge: 'Best Seller', desc: 'The secret to perfectly browned cookie bottoms.' },
    { id: 203, name: 'Double-Walled Glass Mixing Bowls', price: '$54.00', rating: 4.6, reviews: 430, badge: 'Bestseller', desc: 'Retains temperature for better yeast activation.' },
    { id: 204, name: 'Adjustable Stainless Steel Rolling Pin', price: '$38.00', rating: 4.8, reviews: 560, badge: 'Bestseller', desc: 'Uniform thickness for every batch of pastry.' },
  ],
  'everything-need': [
    { id: 301, name: 'Ultimate 50-Piece Decorating Set', price: '$89.00', rating: 4.8, reviews: 215, badge: 'Essential', desc: 'Piping tips, bags, couplers and scrapers in one kit.' },
    { id: 302, name: 'Complete 10-Piece Measuring Set', price: '$24.99', rating: 4.7, reviews: 530, badge: 'Essential', desc: 'Stainless steel cups and spoons with etched markings.' },
    { id: 303, name: 'All-Purpose Ceramic Baker\'s Bowl', price: '$42.00', rating: 4.5, reviews: 180, badge: 'Essential', desc: 'Heavy-duty ceramic for mixing, proofing, and serving.' },
    { id: 304, name: 'Baking Essentials Pantry Set', price: '$35.00', rating: 4.6, reviews: 95, badge: 'Essential', desc: 'Premium yeast, vanilla extract, and fleur de sel.' },
  ],
  'mixing-bowls': [
    { id: 1, name: 'Ceramic Mixing Bowl Set', price: '$45.99', rating: 4.8, reviews: 124, badge: 'Best Seller', desc: 'Set of 3 hand-glazed ceramic bowls in warm cream tones.' },
    { id: 2, name: 'Stainless Steel Prep Bowl', price: '$28.50', rating: 4.6, reviews: 89, badge: null, desc: 'Mirror-polished, dishwasher safe and stackable.' },
    { id: 3, name: 'Glass Mixing Bowl Large', price: '$34.00', rating: 4.7, reviews: 61, badge: 'New', desc: 'Borosilicate glass with pouring spout and non-slip base.' },
  ],
  'baking-pans': [
    { id: 7, name: 'Non-Stick Loaf Pan', price: '$22.99', rating: 4.7, reviews: 310, badge: 'Best Seller', desc: 'Heavy-gauge steel with double non-stick coating.' },
    { id: 8, name: 'Round Cake Pan Set', price: '$39.99', rating: 4.8, reviews: 185, badge: null, desc: '8" and 9" pans, even heat distribution.' },
  ],
  'measuring-tools': [
    { id: 13, name: 'Stainless Measuring Cups', price: '$24.99', rating: 4.9, reviews: 563, badge: 'Best Seller', desc: 'Set of 7, engraved measurements that won\'t fade.' },
    { id: 14, name: 'Precision Kitchen Scale', price: '$49.00', rating: 4.8, reviews: 189, badge: null, desc: 'Digital with 0.1g accuracy and tare function.' },
  ],
  'rolling-pins': [
    { id: 17, name: 'French Tapered Rolling Pin', price: '$32.00', rating: 4.8, reviews: 140, badge: 'Best Seller', desc: 'Solid maple hardwood, tapered for excellent control.' },
    { id: 18, name: 'Marble Rolling Pin', price: '$58.00', rating: 4.9, reviews: 72, badge: 'Premium', desc: 'Heavy marble stays cold — perfect for pastry.' },
  ],
  'whisks-spatulas': [
    { id: 21, name: 'Balloon Whisk Set', price: '$29.00', rating: 4.7, reviews: 280, badge: 'Best Seller', desc: 'Three sizes stainless steel balloon whisks.' },
    { id: 22, name: 'Silicone Spatula 3-Pack', price: '$16.99', rating: 4.8, reviews: 415, badge: 'Best Value', desc: 'Heat-resistant to 480°F.' },
  ],
  'decorating': [
    { id: 26, name: 'Piping Tips Set 52pc', price: '$34.99', rating: 4.8, reviews: 320, badge: 'Best Seller', desc: 'Stainless tips, 3 couplers, 10 reusable bags.' },
  ],
  'timers-scales': [
    { id: 32, name: 'Smart Kitchen Timer', price: '$27.99', rating: 4.7, reviews: 155, badge: 'New', desc: 'Magnetic, water-resistant.' },
  ],
  'storage': [
    { id: 36, name: 'Airtight Glass Jars Set', price: '$44.00', rating: 4.9, reviews: 430, badge: 'Best Seller', desc: 'Set of 6 with bamboo lids.' },
  ],
};

// Flatten for "all"
const ALL_FLATTENED = Object.values(MOCK_PRODUCTS).flat();

/* ── Star rating component ── */
const Stars = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="13" height="13"
          fill={i < full ? '#C9824A' : (i === full && half ? 'url(#half)' : 'none')}
          stroke="#C9824A" strokeWidth="1.5">
          {i === full && half && (
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#C9824A" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
};

/* ── Badge chip ── */
const Badge = ({ text }) => {
  if (!text) return null;
  const colorMap = {
    'Best Seller': '#C9824A',
    'Premium': '#8B6348',
    'New': '#5C9E6E',
    'Best Value': '#4A80A8',
    'Eco': '#6B9E5A',
    'Essential': '#C9956A',
  };
  return (
    <span className="productBadge" style={{ background: colorMap[text] || '#C9824A' }}>
      {text}
    </span>
  );
};

/* ── Sort options ── */
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function ProductsPage({ category, onBack }) {
  const [activeCatId, setActiveCatId] = useState(category.id);
  const [sort, setSort] = useState('popular');
  const [wishlist, setWishlist] = useState(new Set());
  const [cartAdded, setCartAdded] = useState(new Set());
  const [search, setSearch] = useState('');

  // Sync internal category state if prop changes
  useEffect(() => {
    setActiveCatId(category.id);
  }, [category.id]);

  const activeLabel = activeCatId === 'all' 
    ? 'All Products' 
    : (SHOP_CATEGORIES.find(c => c.id === activeCatId)?.label || category.label);

  const rawProducts = activeCatId === 'all' ? ALL_FLATTENED : (MOCK_PRODUCTS[activeCatId] || []);

  /* Filter */
  const filtered = rawProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.desc.toLowerCase().includes(search.toLowerCase())
  );

  /* Sort */
  const sorted = [...filtered].sort((a, b) => {
    const priceA = parseFloat(a.price.replace('$', ''));
    const priceB = parseFloat(b.price.replace('$', ''));
    if (sort === 'price-asc') return priceA - priceB;
    if (sort === 'price-desc') return priceB - priceA;
    if (sort === 'rating') return b.rating - a.rating;
    return b.reviews - a.reviews; // popular
  });

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addToCart = (id) => {
    setCartAdded((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setCartAdded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1800);
  };

  return (
    <section className="productsPage" id="products-listing">
      
      {/* ── Sticky top bar ── */}
      <div className="productsTopBar">
        <div className="productsTopBarInner">
          <nav className="productsBreadcrumb">
            <button className="breadcrumbHome" onClick={onBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Home
            </button>
            <span className="breadcrumbSep">/</span>
            <span className="breadcrumbCurrent">{activeLabel}</span>
          </nav>

          <div className="productsControls">
            <div className="productsSearch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="productsSearchInput"
              />
            </div>

            <div className="productsSort">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="productsSortSelect">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Quick Filter (Combined from ShopByCategory) ── */}
      <div className="productsFilterBanner">
        <div className="filterScrollContainer">
          <button 
            className={`filterTab ${activeCatId === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCatId('all')}
          >
            <span className="filterTabIcon">📦</span>
            All Products
          </button>
          {SHOP_CATEGORIES.map(cat => (
            <button 
              key={cat.id} 
              className={`filterTab ${activeCatId === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCatId(cat.id)}
            >
              <span className="filterTabIcon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page heading ── */}
      <div className="productsHeader">
        <div className="productsHeaderInner">
          <h2 className="productsTitle">{activeLabel}</h2>
          <p className="productsCount">
            {sorted.length} {sorted.length === 1 ? 'product' : 'products'} found
          </p>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="productsGridWrap">
        {sorted.length === 0 ? (
          <div className="productsEmpty">
             <svg viewBox="0 0 64 64" fill="none" stroke="#C9956A" strokeWidth="2" width="64" height="64">
              <circle cx="32" cy="32" r="28" />
              <path d="M22 40s4-8 10-8 10 8 10 8" />
              <circle cx="24" cy="26" r="3" fill="#C9956A"/>
              <circle cx="40" cy="26" r="3" fill="#C9956A"/>
            </svg>
            <p>No products in "<strong>{activeLabel}</strong>" match "<strong>{search}</strong>"</p>
            <button onClick={() => {setSearch(''); setActiveCatId('all');}} className="productsEmptyReset">
              Reset search
            </button>
          </div>
        ) : (
          <div className="productsGrid">
            {sorted.map((product) => (
              <article key={product.id} className="productCard">
                <div className="productImgWrap">
                  <div className="productImgPlaceholder">
                    <svg viewBox="0 0 80 80" fill="none" stroke="#C9956A" strokeWidth="1.5" opacity="0.4" width="60" height="60">
                      <rect x="10" y="10" width="60" height="60" rx="8"/>
                      <circle cx="30" cy="32" r="8"/>
                      <path d="M10 58l18-16 14 12 10-8 18 14"/>
                    </svg>
                  </div>
                  <Badge text={product.badge} />
                  <button
                    className={`wishlistBtn ${wishlist.has(product.id) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(product.id)}
                  >
                    <svg viewBox="0 0 24 24" fill={wishlist.has(product.id) ? '#C9824A' : 'none'}
                      stroke={wishlist.has(product.id) ? '#C9824A' : 'currentColor'}
                      strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>

                <div className="productBody">
                  <h3 className="productName">{product.name}</h3>
                  <p className="productDesc">{product.desc}</p>
                  <div className="productRatingRow">
                    <Stars rating={product.rating} />
                    <span className="productRatingNum">{product.rating}</span>
                    <span className="productReviews">({product.reviews})</span>
                  </div>
                  <div className="productFooter">
                    <span className="productPrice">{product.price}</span>
                    <button
                      className={`addToCartBtn ${cartAdded.has(product.id) ? 'added' : ''}`}
                      onClick={() => addToCart(product.id)}
                    >
                      {cartAdded.has(product.id) ? '✓ Added' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
