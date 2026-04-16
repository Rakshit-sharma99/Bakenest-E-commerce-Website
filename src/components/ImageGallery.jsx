import React, { useState } from 'react';
import './ImageGallery.css';

const ImageGallery = ({ images, mainImage, productName }) => {
  // If the product doesn't have an images array but has a single imageUrl, format it into an array
  const fullGallery = images?.length > 0 ? images : (mainImage ? [mainImage, mainImage, mainImage] : []);
  
  const [activeIndex, setActiveIndex] = useState(0);

  if (fullGallery.length === 0) {
    return (
      <div className="gallery-placeholder">
        <svg viewBox="0 0 80 80" fill="none" stroke="#C9956A" strokeWidth="1.5" opacity="0.4" width="80" height="80">
          <rect x="10" y="10" width="60" height="60" rx="8"/>
          <circle cx="30" cy="32" r="8"/>
          <path d="M10 58l18-16 14 12 10-8 18 14"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="product-image-gallery">
      {/* Thumbnails Column */}
      <div className="gallery-thumbnails">
        {fullGallery.map((img, index) => (
          <div 
            key={index} 
            className={`thumbnail-box ${activeIndex === index ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)} // Flipkart style quick hover switch
          >
            <img src={img} alt={`${productName} thumbnail ${index + 1}`} />
          </div>
        ))}
      </div>

      {/* Main Image View */}
      <div className="gallery-main-view">
        <img 
          src={fullGallery[activeIndex]} 
          alt={`${productName} main view`} 
          className="main-view-image" 
        />
        {/* Heart/Wishlist could be positioned here absolutely */}
      </div>
    </div>
  );
};

export default ImageGallery;
