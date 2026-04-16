import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating, onChange, readonly = false, size = 'medium' }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (!readonly) setHoverRating(0);
  };

  const currentDisplay = readonly ? rating : hoverRating || rating;

  return (
    <div className={`star-rating-container ${size} ${readonly ? 'readonly' : 'interactive'}`}>
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled = value <= currentDisplay;
        const isHalf = !isFilled && value - 0.5 <= currentDisplay && value > currentDisplay;

        return (
          <span
            key={value}
            className={`star ${isFilled ? 'filled' : ''} ${isHalf ? 'half-filled' : ''}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            title={readonly ? `${rating} out of 5 stars` : `Rate ${value} stars`}
            aria-label={`Star ${value}`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
