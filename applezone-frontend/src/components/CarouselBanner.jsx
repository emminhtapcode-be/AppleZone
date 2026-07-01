import React from 'react';
import { Link } from 'react-router-dom';
import './CarouselBanner.css';

const CarouselBanner = () => {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">
          THE DEFINITIVE SPACE<br />FOR <span className="text-gradient">PREMIUM TECH.</span>
        </h1>
        <p className="hero-subtitle">
          Khám phá không gian công nghệ đỉnh cao với các sản phẩm Apple chính hãng. Đẳng cấp, tinh tế, và dẫn đầu xu hướng.
        </p>
        <div className="hero-actions">
          <Link to="/products?category=iphone" className="btn-primary">
            Khám phá iPhone
          </Link>
          <Link to="/products?category=mac" className="btn-secondary">
            Mua Mac
          </Link>
        </div>
      </div>
      
      <div className="hero-visual">
        <div className="glow-circle"></div>
        {/* Placeholder for a beautiful 3D render of Apple products */}
        <div className="mockup-frame glass-panel">
          <div className="mockup-inner"></div>
        </div>
      </div>
    </div>
  );
};

export default CarouselBanner;
