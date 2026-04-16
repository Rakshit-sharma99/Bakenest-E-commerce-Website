import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './RelatedProducts.css';

const RelatedProducts = ({ category, currentProductId, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        // Fetch products matching the same category
        const payload = await api.request(`/products?category=${category}&limit=5`);
        if (payload?.items) {
          // Filter out the current product so it doesn't show up in its own "Related" list
          const related = payload.items.filter(p => p._id !== currentProductId).slice(0, 4);
          setProducts(related);
        }
      } catch (err) {
        console.error('Failed to fetch related products', err);
      } finally {
        setLoading(false);
      }
    };

    if (category) fetchRelated();
  }, [category, currentProductId]);

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <div className="related-products-section">
      <h3 className="related-title">Similar Products You May Like</h3>
      <div className="related-grid">
        {products.map(product => (
          <div key={product._id} className="related-card" onClick={() => onProductClick(product)}>
            <div className="related-img-wrap">
              {product.imageUrl || (product.images && product.images[0]) ? (
                <img src={product.imageUrl || product.images[0]} alt={product.name} />
              ) : (
                <div className="related-img-placeholder" />
              )}
            </div>
            <div className="related-body">
              <h4 className="related-name">{product.name}</h4>
              <div className="related-price">
                ${product.price?.toFixed(2)}
              </div>
              <div className="related-rating">
                <span className="rating-badge">{product.rating || 0} ★</span>
                <span className="rating-count">({product.reviewsCount || 0})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
