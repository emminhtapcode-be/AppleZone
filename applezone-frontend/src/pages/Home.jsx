import React, { useEffect, useState } from 'react';
import CarouselBanner from '../components/CarouselBanner';
import ProductCard from '../components/ProductCard';
import useProductStore from '../store/useProductStore';
import './Home.css';

const Home = () => {
  const { products, fetchProducts, isLoading } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // If products is wrapped in an object like { data, total }, extract it.
  const productList = Array.isArray(products) ? products : (products?.data || []);

  return (
    <div className="home-page">
      <CarouselBanner />
      
      <div className="container">
        <section className="flash-sale-section">
          <div className="flash-sale-header">
            <div className="flash-sale-title">
              <h2>SẢN PHẨM MỚI</h2>
            </div>
          </div>

          {isLoading ? (
            <p style={{textAlign: 'center', color: '#999'}}>Đang tải sản phẩm...</p>
          ) : (
            <div className="products-grid">
              {productList.slice(0, 5).map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </section>

        <section className="featured-section">
          <h2 className="section-title">Gợi ý cho bạn</h2>
          {isLoading ? (
            <p style={{textAlign: 'center', color: '#999'}}>Đang tải sản phẩm...</p>
          ) : (
            <div className="products-grid">
              {productList.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
