import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  // Topzone often has fake original prices if missing, let's mock one if not provided
  const price = product.base_price;
  const mockDiscount = 0.15; // 15% discount for UI purposes
  const originalPrice = price / (1 - mockDiscount);

  const formatPrice = (p) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  return (
    <Link to={`/products/${product.product_id}`} className="product-card">
      <div className="product-image-container">
        <img 
          src={product.thumbnail_url || 'https://via.placeholder.com/200?text=Apple+Product'} 
          alt={product.product_name} 
          className="product-image" 
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.product_name}</h3>
        <div className="price-container">
          <div className="current-price">{formatPrice(price)}</div>
          <div className="old-price-row">
            <span className="original-price">{formatPrice(originalPrice)}</span>
            <span className="discount-badge">-15%</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
