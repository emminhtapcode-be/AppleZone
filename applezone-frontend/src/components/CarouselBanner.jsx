import React from 'react';
import { Link } from 'react-router-dom';
import './CarouselBanner.css';

const CarouselBanner = () => {
  // Mock simple banner since we don't have images
  return (
    <div className="carousel-container">
      <div 
        className="carousel-slide" 
        style={{ 
          background: 'linear-gradient(135deg, #111 0%, #2a2a2a 100%)' 
        }}
      >
        <div className="carousel-content">
          <h2 style={{color: '#fff'}}>SAY MƯỚT</h2>
          <p style={{color: '#ccc'}}>Càng Lướt Càng Yêu.</p>
          <Link to="/products?category=iphone" className="carousel-btn">
            Mua ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarouselBanner;
