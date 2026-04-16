import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ImageGallery from './ImageGallery';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import './ProductDetailPage.css';

const ProductDetailPage = ({ productId, initialProduct, onBack, user, onProductClick, onAddToCart, onCartOpen }) => {
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState('');
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const incomingId = initialProduct?._id || initialProduct?.id;
    if (initialProduct && String(incomingId) === String(productId)) {
      setProduct(initialProduct);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.request(`/products/${productId}`)
      .then((data) => setProduct(data))
      .catch((err) => {
        console.error(err);
        setError('Failed to load product details.');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    if (onAddToCart) {
      onAddToCart(product);
      setCartMsg('Added to cart!');
      setTimeout(() => setCartMsg(''), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (onAddToCart) onAddToCart(product);
    if (onCartOpen) onCartOpen(); // Opens the cart overlay immediately
  };

  if (loading) {
    return (
      <div className="pdp-loading-skeleton">
        <div className="skeleton-gallery" />
        <div className="skeleton-info">
          <div className="skeleton-title" />
          <div className="skeleton-price" />
          <div className="skeleton-desc" />
          <div className="skeleton-desc" />
          <div className="skeleton-button" />
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

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

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
            <span className="pdp-rating-badge">{Number(product.rating || 0).toFixed(1)} ★</span>
            <span className="pdp-rating-count">
              {product.reviewsCount || 0} Ratings &amp; Reviews
            </span>
            {product.featured && <span className="pdp-badge-highlight">Bestseller</span>}
          </div>

          {/* Pricing */}
          <div className="pdp-pricing">
            <span className="pdp-final-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
            {product.comparePrice > product.price && (
              <>
                <span className="pdp-original-price">₹{Number(product.comparePrice).toLocaleString('en-IN')}</span>
                <span className="pdp-discount">{discount}% off</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="pdp-stock-status">
            {product.stock > 0 ? (
              <span className="in-stock">✓ In Stock ({product.stock} available)</span>
            ) : (
              <span className="out-of-stock">✗ Out of Stock</span>
            )}
          </div>

          {/* Short Description */}
          <div className="pdp-short-desc">
            <p>{product.description}</p>
          </div>

          {/* Cart Feedback */}
          {cartMsg && <div className="pdp-cart-feedback">{cartMsg}</div>}

          {/* Action Buttons */}
          <div className="pdp-actions">
            <button
              className="pdp-btn add-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <span className="icon">🛒</span>
              ADD TO CART
            </button>
            <button
              className="pdp-btn buy-now-btn"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              <span className="icon">⚡</span>
              BUY NOW
            </button>
          </div>

          {/* Guarantees — driven by DB values */}
          <div className="pdp-guarantees">
            {product.returnsAllowed !== false ? (
              <div className="guarantee-item">
                <span className="g-icon">✓</span> Return Possible
              </div>
            ) : (
              <div className="guarantee-item no-return">
                <span className="g-icon">✕</span> No Returns
              </div>
            )}
            {product.warranty && (
              <div className="guarantee-item">
                <span className="g-icon">✓</span> {product.warranty}
              </div>
            )}
            <div className="guarantee-item">
              <span className="g-icon">✓</span> Secure COD &amp; Payment
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Product Info */}
      <div className="pdp-detailed-desc">
        <h3>Product Details</h3>
        <div className="detailed-desc-content">
          <p>{product.description}</p>
          <ul>
            <li><strong>Category:</strong> {product.category}</li>
            {product.warranty && <li><strong>Warranty:</strong> {product.warranty}</li>}
            <li><strong>Returns:</strong> {product.returnsAllowed !== false ? 'Allowed' : 'Not allowed'}</li>
            <li><strong>SKU:</strong> {(product._id || product.id)?.toString().slice(-8).toUpperCase()}</li>
            <li><strong>Stock:</strong> {product.stock} units available</li>
          </ul>
        </div>
      </div>

      {/* Reviews */}
      <div className="pdp-reviews-wrapper">
        <ProductReviews productId={productId} user={user} />
      </div>

      {/* Related Products */}
      <div className="pdp-related-wrapper">
        <RelatedProducts
          category={product.category}
          currentProductId={productId}
          onProductClick={onProductClick}
          explicitProducts={product.relatedProducts}
        />
      </div>
    </div>
  );
};

export default ProductDetailPage;
