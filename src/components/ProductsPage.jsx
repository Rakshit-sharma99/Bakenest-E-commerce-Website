import { useState, useEffect, useCallback, memo } from 'react';
import './ProductsPage.css';
import { SHOP_CATEGORIES } from '../constants/categories';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { SkeletonProductGrid } from './SkeletonLoader';

const formatPrice = (value) => `₹${Number(value || 0).toFixed(2)}`;

const getEffectivePrice = (product) => {
  const basePrice = Number(product.price || 0);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = product.appliedDiscount;

  if (!discount?.active || discount.type === 'none' || !discount.value) {
    return { finalPrice: basePrice, originalPrice: comparePrice && comparePrice > basePrice ? comparePrice : null };
  }

  if (discount.type === 'flat') {
    return { finalPrice: Math.max(basePrice - Number(discount.value), 0), originalPrice: basePrice };
  }

  const reduction = (basePrice * Number(discount.value)) / 100;
  return { finalPrice: Math.max(basePrice - reduction, 0), originalPrice: basePrice };
};

/* ── Star rating component (memoised — only re-renders when rating changes) ── */
const Stars = memo(function Stars({ rating }) {
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
});

/* ── Badge chip (memoised) ── */
const Badge = memo(function Badge({ text }) {
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
});

/* ── Sort options ── */
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function ProductsPage({ category, onBack, onAddToCart, onProductClick }) {
  const [activeCatId, setActiveCatId] = useState(category?.id || 'all');
  const [sort, setSort] = useState('popular');
  const [wishlist, setWishlist] = useState(new Set());
  const [cartAdded, setCartAdded] = useState(new Set());
  const [search, setSearch] = useState('');
  const [liveProducts, setLiveProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async (catId) => {
    setLoading(true);
    try {
      const categoryParam = catId && catId !== 'all' ? `&category=${catId}` : '';
      const payload = await api.request(`/products?limit=100&active=true${categoryParam}`);
      setLiveProducts(payload.items || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setLiveProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(activeCatId); }, [activeCatId, loadProducts]);

  useEffect(() => {
    if (category?.id) setActiveCatId(category.id);
  }, [category]);

  useEffect(() => {
    const socket = getSocket();
    const syncProducts = () => loadProducts(activeCatId);
    socket.on('products:changed', syncProducts);
    return () => { socket.off('products:changed', syncProducts); };
  }, [activeCatId, loadProducts]);

  const activeLabel = activeCatId === 'all' 
    ? 'All Products' 
    : (SHOP_CATEGORIES.find(c => c.id === activeCatId)?.label || category?.label || 'Baking Tools');

  /* Filter */
  const filtered = liveProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.desc || p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  /* Sort */
  const sorted = [...filtered].sort((a, b) => {
    const priceA = Number(typeof a.price === 'string' ? a.price.replace('₹', '') : a.price || 0);
    const priceB = Number(typeof b.price === 'string' ? b.price.replace('₹', '') : b.price || 0);
    if (sort === 'price-asc') return priceA - priceB;
    if (sort === 'price-desc') return priceB - priceA;
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (b.reviews || b.reviewsCount || 0) - (a.reviews || a.reviewsCount || 0); // popular
  });

  const toggleWishlist = useCallback((id) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const addToCartAction = useCallback((product) => {
    const id = product._id || product.id;
    setCartAdded((prev) => new Set(prev).add(id));
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      setCartAdded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1800);
  }, [onAddToCart]);

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
        {loading ? (
          <SkeletonProductGrid count={6} />
        ) : sorted.length === 0 ? (
          <div className="productsEmpty">
            <svg viewBox="0 0 64 64" fill="none" stroke="#C9956A" strokeWidth="2" width="64" height="64">
              <circle cx="32" cy="32" r="28" />
              <path d="M22 40s4-8 10-8 10 8 10 8" />
              <circle cx="24" cy="26" r="3" fill="#C9956A" />
              <circle cx="40" cy="26" r="3" fill="#C9956A" />
            </svg>
            <p>No products in "<strong>{activeLabel}</strong>" match "<strong>{search}</strong>"</p>
            <button onClick={() => { setSearch(''); setActiveCatId('all'); }} className="productsEmptyReset">
              Reset search
            </button>
          </div>
        ) : (
          <div className="productsGrid" role="list">
            {sorted.map((product, index) => {
              const productId = product._id || product.id;
              // Stagger delay capped at stagger-6 to avoid over-delaying
              const staggerClass = `stagger-${Math.min(index + 1, 6)}`;
              return (
                <article
                  key={productId}
                  className={`productCard animate-slideUp ${staggerClass}`}
                  role="listitem"
                >
                  <div
                    className="productImgWrap"
                    onClick={() => onProductClick && onProductClick(product)}
                    style={{ cursor: onProductClick ? 'pointer' : 'default' }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="productImage"
                        loading="lazy"
                        width="300"
                        height="300"
                        decoding="async"
                      />
                    ) : (
                      <div className="productImgPlaceholder">
                        <svg viewBox="0 0 80 80" fill="none" stroke="#C9956A" strokeWidth="1.5" opacity="0.4" width="60" height="60">
                          <rect x="10" y="10" width="60" height="60" rx="8" />
                          <circle cx="30" cy="32" r="8" />
                          <path d="M10 58l18-16 14 12 10-8 18 14" />
                        </svg>
                      </div>
                    )}
                    <Badge text={product.badge} />
                    <button
                      className={`wishlistBtn ${wishlist.has(productId) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(productId); }}
                      aria-label={wishlist.has(productId) ? 'Remove from wishlist' : 'Add to wishlist'}
                      aria-pressed={wishlist.has(productId)}
                    >
                      <svg viewBox="0 0 24 24" fill={wishlist.has(productId) ? '#C9824A' : 'none'}
                        stroke={wishlist.has(productId) ? '#C9824A' : 'currentColor'}
                        strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  <div className="productBody">
                    <h3
                      className="productName"
                      onClick={() => onProductClick && onProductClick(product)}
                      style={{ cursor: onProductClick ? 'pointer' : 'default' }}
                    >
                      {product.name}
                    </h3>
                    <p className="productDesc">{product.desc || product.description}</p>
                    <div className="productRatingRow">
                      <Stars rating={product.rating || 0} />
                      <span className="productRatingNum">{product.rating || 0}</span>
                      <span className="productReviews">({product.reviews || product.reviewsCount || 0})</span>
                    </div>
                    <div className="productFooter">
                      <span className="productPrice">
                        {(() => {
                          const pricing = getEffectivePrice(product);
                          return pricing.originalPrice ? (
                            <>
                              <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: 8 }}>
                                {formatPrice(pricing.originalPrice)}
                              </span>
                              {formatPrice(pricing.finalPrice)}
                            </>
                          ) : formatPrice(pricing.finalPrice);
                        })()}
                      </span>
                      <button
                        className={`addToCartBtn ${cartAdded.has(productId) ? 'added' : ''}`}
                        onClick={() => addToCartAction(product)}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        {cartAdded.has(productId) ? '✓ Added' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  );
}
