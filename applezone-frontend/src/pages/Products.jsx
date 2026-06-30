import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useProductStore from '../store/useProductStore';

const Products = () => {
  const { products, isLoading, error, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (isLoading) return <p>Đang tải sản phẩm...</p>;
  if (error) return <p style={{ color: 'red' }}>Lỗi: {error}</p>;

  return (
    <div>
      <h2>Danh sách sản phẩm</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {products.map((product) => (
          <div key={product.id || product._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            {product.image && <img src={product.image} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />}
            <h3>{product.name}</h3>
            <p style={{ color: 'green', fontWeight: 'bold' }}>{product.price}đ</p>
            <Link to={`/products/${product.id || product._id}`} style={{ display: 'inline-block', marginTop: '10px', padding: '8px 12px', background: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '3px' }}>
              Xem chi tiết
            </Link>
          </div>
        ))}
        {products.length === 0 && <p>Chưa có sản phẩm nào.</p>}
      </div>
    </div>
  );
};

export default Products;
