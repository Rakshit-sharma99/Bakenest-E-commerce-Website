import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ImageGallery from './ImageGallery';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import './ProductDetailPage.css';

const ProductDetailPage = ({ productId, initialProduct, onBack, user, onProductClick }) => {
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState('');
  const [cartAdding, setCartAdding] = useState(false);

  useEffect(() => {
    // Scroll to top immediately when mounting a new PDP
    window.scrollTo({ top: 0, behavior: 'instant' });

    const fetchProduct = async () => {
      if (initialProduct && initialProduct._id === productId) {
        setProduct(initialProduct);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await api.request(`/products/${productId}`);
        setProduct(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, initialProduct]);

  if (loading) {
    return (
      <div className="pdp-loading-skeleton">
        <div className="skeleton-gallery"></div>
        <div className="skeleton-info">
          <div className="skeleton-title"></div>
          <div className="skeleton-price"></div>
          <div className="skeleton-desc"></div>
          <div className="skeleton-desc"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pdp-error-state">
        <button className="back-button" onClick={onBack}>← Back to products</button>
        <h2>{error || 'Product not found'}</h2>
      </div>
    );
  }

  const handleAddToCart = () => {
    setCartAdding(true);
    // Mimic cart action
    setTimeout(() => {
      setCartAdding(false);
    }, 1500);
  };

  return (
    <div className="pdp-container">
      {/* Breadcrumbs */}
      <nav className="pdp-breadcrumb">
        <button onClick={onBack}>Home</button>
        <span>/</span>
        <button onClick={onBack}>{product.category || 'Shop'}</button>
        <span>/</span>
        <span className="pdp-bread-current">{product.name}</span>
      </nav>

      {/* Main PDP Layout */}
      <div className="pdp-main-row">
        {/* Left: Gallery */}
        <div className="pdp-gallery-column">
          <ImageGallery 
            images={product.images} 
            mainImage={product.imageUrl} 
            productName={product.name} 
          />
        </div>

        {/* Right: Info */}
        <div className="pdp-info-column">
          <h1 className="pdp-title">{product.name}</h1>
          
          <div className="pdp-rating-summary">
            <span className="pdp-rating-badge">{product.rating || 0} ★</span>
            <span className="pdp-rating-count">
              {product.reviewsCount || 0} Ratings & Reviews
            </span>
            {product.badge && <span className="pdp-badge-highlight">{product.badge}</span>}
          </div>

          <div className="pdp-pricing">
            <span className="pdp-final-price">${Number(product.price).toFixed(2)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <>
                <span className="pdp-original-price">${Number(product.comparePrice).toFixed(2)}</span>
                <span className="pdp-discount">
                  {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% off
                </span>
              </>
            )}
          </div>

          <div className="pdp-stock-status">
            {product.stock > 0 ? (
              <span className="in-stock">In Stock ({product.stock} available)</span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </div>

          <div className="pdp-short-desc">
            <p>{product.description}</p>
          </div>

          <div className="pdp-actions">
            <button 
              className={`pdp-btn add-cart-btn ${cartAdding ? 'adding' : ''}`}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <span className="icon">🛒</span>
              {cartAdding ? 'Added to Cart' : 'ADD TO CART'}
            </button>
            <button className="pdp-btn buy-now-btn" disabled={product.stock === 0}>
              <span className="icon">⚡</span>
              BUY NOW
            </button>
          </div>

          {/* Flipkart style feature guarantees */}
          <div className="pdp-guarantees">
            <div className="guarantee-item">
              <span className="g-icon">✓</span> 30 Day Returns
            </div>
            <div className="guarantee-item">
              <span className="g-icon">✓</span> 1 Year Warranty
            </div>
            <div className="guarantee-item">
              <span className="g-icon">✓</span> Secure Payment
            </div>
          </div>
        </div>
      </div>

      {/* Description Layout */}
      <div className="pdp-detailed-desc">
        <h3>Product Details</h3>
        <div className="detailed-desc-content">
          <p>{product.description}</p>
          <ul>
            <li>Premium construction materials</li>
            <li>Category: {product.category}</li>
            <li>SKU: {product._id || product.id}</li>
          </ul>
        </div>
      </div>

      {/* RATING & REVIEWS SECTION */}
      <div className="pdp-reviews-wrapper">
        <ProductReviews productId={productId} user={user} />
      </div>

      {/* RELATED PRODUCTS */}
      <div className="pdp-related-wrapper">
        <RelatedProducts 
          category={product.category} 
          currentProductId={productId} 
          onProductClick={onProductClick} 
        />
      </div>

    </div>
  );
};

export default ProductDetailPage;
