import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './FeaturedProducts.css';

export default function FeaturedProducts({ title = "Featured Products", category = 'all', onProductClick, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Fetch products. If category is 'all', we might want to filter by featured=true
    // Otherwise, we fetch products from that category.
    const url = category === 'all'
      ? '/products?featured=true&limit=4&active=true'
      : `/products?category=${category}&limit=4&active=true`;

    api.request(url)
      .then(data => {
        if (isMounted) {
          setProducts(data.items || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError('Failed to load products');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [category]);

  if (loading) {
    return (
      <section className="featured-products">
        <h2 className="featured-title">{title}</h2>
        <div className="featured-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="featured-skeleton-card">
              <div className="skeleton-img" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || products.length === 0) return null;

  return (
    <section className="featured-products">
      <div className="featured-header">
        <h2 className="featured-title">{title}</h2>
        <div className="featured-line" />
      </div>

      <div className="featured-grid">
        {products.map(product => (
          <div key={product._id} className="featured-card">
            <div className="featured-img-wrap" onClick={() => onProductClick(product)}>
              <img src={product.imageUrl} alt={product.name} />
              {product.stock === 0 && <span className="featured-out-badge">Out of Stock</span>}
            </div>
            <div className="featured-info">
              <h3 onClick={() => onProductClick(product)}>{product.name}</h3>
              <p className="featured-category">{product.category}</p>
              <div className="featured-footer">
                <span className="featured-price">₹{product.price.toLocaleString('en-IN')}</span>
                <button
                  className="featured-add-btn"
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Sold Out' : 'Add +'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
