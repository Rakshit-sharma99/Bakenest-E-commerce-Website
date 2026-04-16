import React, { useState } from 'react';
import StarRating from './StarRating';
import './ReviewForm.css';

const ReviewForm = ({ productId, onReviewAdded, user }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return (
      <div className="review-login-prompt">
        <p>Please log in to write a review. We'd love to hear your thoughts!</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a review comment.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Example utilizing local token logic - adjust depending on actual auth structure
      const token = localStorage.getItem('token'); 
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, rating, comment })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Review submitted successfully!');
        setRating(0);
        setComment('');
        if (onReviewAdded) onReviewAdded(data.data);
      } else {
        setError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form-container">
      <h3>Have you used this product?</h3>
      <p>Rate it and help others make a better choice.</p>
      
      {error && <div className="review-error">{error}</div>}
      {success && <div className="review-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="rating-input-group">
          <label>Your Rating</label>
          <StarRating rating={rating} onChange={setRating} size="large" />
        </div>

        <div className="comment-input-group">
          <label>Your Review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike? How did you use it?"
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" className="submit-review-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
