import './SkeletonLoader.css';

/**
 * Generic skeleton block — inherits the global `.skeleton` shimmer.
 * @param {string}  width    - CSS width (default '100%')
 * @param {string}  height   - CSS height (default '1rem')
 * @param {boolean} rounded  - Use full border-radius (pill/circle)
 * @param {number}  count    - Repeat N stacked rows
 * @param {string}  gap      - Gap between rows when count > 1
 */
export function SkeletonBlock({ width = '100%', height = '1rem', rounded = false, count = 1, gap = '8px' }) {
  const blocks = Array.from({ length: count });
  return (
    <div className="skeleton-stack" style={{ display: 'flex', flexDirection: 'column', gap }}>
      {blocks.map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width,
            height,
            borderRadius: rounded ? '9999px' : undefined,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Product card skeleton — mirrors the exact layout of a real ProductCard.
 */
export function SkeletonProductCard() {
  return (
    <div className="skeleton-card" aria-hidden="true" role="presentation">
      <div className="skeleton skeleton-card-image" />
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-card-title" />
        <div className="skeleton skeleton-card-desc" />
        <div className="skeleton skeleton-card-desc short" />
        <div className="skeleton-card-footer">
          <div className="skeleton skeleton-card-price" />
          <div className="skeleton skeleton-card-btn" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product grid skeleton — renders N card skeletons in a grid.
 */
export function SkeletonProductGrid({ count = 8 }) {
  return (
    <div className="skeleton-product-grid" aria-label="Loading products…" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

/**
 * Order history row skeleton.
 */
export function SkeletonOrderRow({ count = 3 }) {
  return (
    <div className="skeleton-orders" aria-label="Loading orders…" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-order-row">
          <div className="skeleton-order-left">
            <div className="skeleton skeleton-order-id" />
            <div className="skeleton skeleton-order-date" />
          </div>
          <div className="skeleton skeleton-order-status" />
          <div className="skeleton skeleton-order-total" />
        </div>
      ))}
    </div>
  );
}

/**
 * Address card skeleton.
 */
export function SkeletonAddressCard({ count = 2 }) {
  return (
    <div className="skeleton-addr-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-addr-card">
          <div className="skeleton skeleton-addr-label" />
          <div className="skeleton skeleton-addr-line" />
          <div className="skeleton skeleton-addr-line" />
          <div className="skeleton skeleton-addr-line short" />
        </div>
      ))}
    </div>
  );
}

export default SkeletonProductGrid;
