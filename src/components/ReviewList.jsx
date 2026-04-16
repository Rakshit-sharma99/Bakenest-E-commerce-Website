import React from 'react';
import StarRating from './StarRating';
import './ReviewList.css';

const ReviewList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="review-list-container">
      {reviews.map((review) => (
        <div key={review._id} className="review-item">
          <div className="review-header">
            <StarRating rating={review.rating} readonly size="small" />
            <span className="review-date">
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          
          <div className="review-body">
            <p className="review-comment">{review.comment}</p>
          </div>

          <div className="review-footer">
            <span className="review-author">
              <span className="avatar-circle">
                {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
              </span>
              {review.user?.name || 'Anonymous User'}
            </span>

            {/* Advanced: Helpful button UI */}
            <button className="helpful-btn">
              👍 Helpful {review.likes > 0 && <span className="likes-count">({review.likes})</span>}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
