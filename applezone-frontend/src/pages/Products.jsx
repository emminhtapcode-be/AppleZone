import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import useProductStore from '../store/useProductStore';
import './Products.css';

const Products = () => {
  const { products, isLoading, error, fetchProducts } = useProductStore();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category');

  useEffect(() => {
    // In a real app, you'd pass category to fetchProducts
    fetchProducts();
  }, [fetchProducts, category]);

  if (isLoading) return <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>Đang tải sản phẩm...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: '40px' }}>Lỗi: {error}</p>;

  // Ensure products is an array
  const productList = Array.isArray(products) ? products : (products?.data || []);

  const categoryName = category ? category.toUpperCase() : "TẤT CẢ SẢN PHẨM";

  return (
    <div className="products-page container">
      <h2 className="category-header">{categoryName}</h2>
      
      <div className="filters-bar">
        <button className="filter-btn active">Mới nhất</button>
        <button className="filter-btn">Bán chạy</button>
        <button className="filter-btn">Giá thấp đến cao</button>
        <button className="filter-btn">Giá cao đến thấp</button>
      </div>

      <div className="products-grid-full">
        {productList.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
        {productList.length === 0 && <p style={{color: '#999', gridColumn: '1 / -1', textAlign: 'center'}}>Không tìm thấy sản phẩm nào.</p>}
      </div>
    </div>
  );
};

export default Products;
