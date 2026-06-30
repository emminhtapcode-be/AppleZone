import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProductStore from '../store/useProductStore';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProduct, isLoading, error, fetchProductById } = useProductStore();
  const { addToCart, isLoading: isAddingToCart } = useCartStore();
  const { token } = useAuthStore();

  useEffect(() => {
    fetchProductById(id);
  }, [id, fetchProductById]);

  const handleAddToCart = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    await addToCart(id, 1);
    alert('Đã thêm vào giỏ hàng!');
  };

  if (isLoading) return <p>Đang tải thông tin sản phẩm...</p>;
  if (error) return <p style={{ color: 'red' }}>Lỗi: {error}</p>;
  if (!currentProduct) return <p>Không tìm thấy sản phẩm.</p>;

  return (
    <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
      <div style={{ flex: '1' }}>
        {currentProduct.image ? (
          <img src={currentProduct.image} alt={currentProduct.name} style={{ width: '100%', borderRadius: '5px' }} />
        ) : (
          <div style={{ width: '100%', height: '300px', background: '#eee', borderRadius: '5px' }}></div>
        )}
      </div>
      <div style={{ flex: '2' }}>
        <h2>{currentProduct.name}</h2>
        <p style={{ fontSize: '1.5rem', color: 'green', fontWeight: 'bold' }}>{currentProduct.price}đ</p>
        <p>{currentProduct.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
        <button 
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          style={{ padding: '10px 20px', background: '#ff9900', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '1.1rem', marginTop: '20px' }}
        >
          {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
