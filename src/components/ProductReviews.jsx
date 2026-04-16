import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import './ProductReviews.css';

const ProductReviews = ({ productId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');

  const fetchReviews = async () => {
    // Only show loader on first fetch, not re-sorts
    if (reviews.length === 0) setLoading(true);
    setError('');
    try {
      // Use api.request() so the correct base URL + auth headers are applied
      const data = await api.request(`/reviews/${productId}?sort=${sortOrder}`);
      setReviews(data.data || []);
      setBreakdown(data.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      setTotalReviews(data.count || 0);

      if (data.count > 0 && data.data) {
        const sum = data.data.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(Math.round((sum / data.count) * 10) / 10);
      } else {
        setAverageRating(0);
      }
    } catch (err) {
      console.error('Reviews fetch failed:', err);
      setError('Could not load reviews at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, sortOrder]);

  const handleReviewAdded = (newReview) => {
    const updatedReviews = [newReview, ...reviews].sort((a, b) =>
      sortOrder === 'latest'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : b.rating - a.rating
    );
    setReviews(updatedReviews);
    const newTotal = totalReviews + 1;
    setTotalReviews(newTotal);
    setBreakdown((prev) => ({ ...prev, [newReview.rating]: (prev[newReview.rating] || 0) + 1 }));
    setAverageRating((prev) => {
      const newAvg = (prev * totalReviews + newReview.rating) / newTotal;
      return Math.round(newAvg * 10) / 10;
    });
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="reviews-loading-bar" />
        <div className="reviews-loading-bar short" />
      </div>
    );
  }

  return (
    <div className="product-reviews-section">
      <h2 className="reviews-section-title">Ratings &amp; Reviews</h2>

      <div className="reviews-overview-container">
        {/* Average Rating Box */}
        <div className="rating-summary-box">
          <div className="avg-rating-display">
            <span className="big-rating">{averageRating || 0}</span>
            <span className="star-icon">★</span>
          </div>
          <div className="total-ratings-text">{totalReviews} Ratings &amp; Reviews</div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="rating-bars-box">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            let colorClass = 'bar-green';
            if (star === 3) colorClass = 'bar-yellow';
            if (star === 2) colorClass = 'bar-orange';
            if (star === 1) colorClass = 'bar-red';

            return (
              <div key={star} className="rating-bar-row">
                <span className="bar-label">{star} ★</span>
                <div className="bar-bg">
                  <div
                    className={`bar-fill ${colorClass}`}
                    style={{ width: `${percentage}%`, transition: 'width 0.4s ease' }}
                  />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {error && <div className="reviews-error">{error}</div>}

      {/* Review Submission Form */}
      <ReviewForm productId={productId} user={user} onReviewAdded={handleReviewAdded} />

      {/* Sort Controls */}
      {reviews.length > 0 && (
        <div className="review-sort-controls">
          <span className="sort-label">Sort by:</span>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="latest">Most Recent</option>
            <option value="highest">Highest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 && !error ? (
        <div className="reviews-empty">No reviews yet. Be the first to review this product!</div>
      ) : (
        <ReviewList reviews={reviews} />
      )}
    </div>
  );
};

export default ProductReviews;
