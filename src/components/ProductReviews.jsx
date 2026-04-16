import React, { useState, useEffect } from 'react';
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
    try {
      setLoading(true);
      const url = `/api/reviews/${productId}?sort=${sortOrder}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.data || []);
        setBreakdown(data.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setTotalReviews(data.count || 0);

        // Calculate average locally for UI freshness
        if (data.count > 0 && data.data) {
          const sum = data.data.reduce((acc, curr) => acc + curr.rating, 0);
          setAverageRating(Math.round((sum / data.count) * 10) / 10);
        }
      } else {
        setError('Failed to fetch reviews');
      }
    } catch (err) {
      console.error(err);
      // Since backend isn't actively reachable in this environment due to DB error, 
      // let's not crash the UI with endless spinners if it fails.
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
    // Optimistically update the UI without needing a full refetch
    setReviews([...reviews, newReview].sort((a,b) => sortOrder === 'latest' ? new Date(b.createdAt) - new Date(a.createdAt) : b.rating - a.rating));
    setTotalReviews(prev => prev + 1);
    
    // Update breakdown & average
    setBreakdown(prev => ({
      ...prev,
      [newReview.rating]: prev[newReview.rating] + 1
    }));
    
    setAverageRating(prev => {
      const oldSum = prev * totalReviews;
      const newAvg = (oldSum + newReview.rating) / (totalReviews + 1);
      return Math.round(newAvg * 10) / 10;
    });
  };

  if (loading) return <div className="reviews-loading">Loading reviews...</div>;

  return (
    <div className="product-reviews-section">
      <h2 className="reviews-section-title">Ratings & Reviews</h2>

      <div className="reviews-overview-container">
        {/* Rating Breakdown */}
        <div className="rating-summary-box">
          <div className="avg-rating-display">
            <span className="big-rating">{averageRating || 0}</span>
            <span className="star-icon">★</span>
          </div>
          <div className="total-ratings-text">{totalReviews} Ratings & Reviews</div>
        </div>

        <div className="rating-bars-box">
          {[5, 4, 3, 2, 1].map(star => {
            const count = breakdown[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            // Flipkart style coloring based on rating value
            let colorClass = 'bar-green';
            if (star === 2) colorClass = 'bar-orange';
            if (star === 1) colorClass = 'bar-red';

            return (
              <div key={star} className="rating-bar-row">
                <span className="bar-label">{star} ★</span>
                <div className="bar-bg">
                  <div className={`bar-fill ${colorClass}`} style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Form */}
      <ReviewForm productId={productId} user={user} onReviewAdded={handleReviewAdded} />

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="review-sort-controls">
          <span className="sort-label">Sort by:</span>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="latest">Most Recent</option>
            <option value="highest">Highest Rating</option>
          </select>
        </div>
      )}

      {/* List */}
      <ReviewList reviews={reviews} />
    </div>
  );
};

export default ProductReviews;
