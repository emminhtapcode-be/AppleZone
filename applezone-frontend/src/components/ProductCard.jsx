import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const price = product.base_price || 0;

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
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
