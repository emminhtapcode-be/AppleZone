import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProductStore from '../store/useProductStore';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProduct, isLoading, error, fetchProductById } = useProductStore();
  const { addToCart, isLoading: isAddingToCart } = useCartStore();
  const { token } = useAuthStore();
  
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    fetchProductById(id);
  }, [id, fetchProductById]);

  const handleAddToCart = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    // We assume backend expects variant_id, for mock we just send product id or 1
    await addToCart(currentProduct?.product_id || id, 1);
    alert('Đã thêm vào giỏ hàng!');
  };

  if (isLoading) return <p style={{textAlign: 'center', color: '#999', marginTop: '40px'}}>Đang tải thông tin sản phẩm...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: '40px' }}>Lỗi: {error}</p>;
  if (!currentProduct) return <p style={{textAlign: 'center', color: '#999', marginTop: '40px'}}>Không tìm thấy sản phẩm.</p>;

  const formatPrice = (p) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
  };

  return (
    <div className="product-detail-page container">
      <div className="product-detail-container">
        <div className="product-gallery">
          <img 
            src={currentProduct.thumbnail_url || 'https://via.placeholder.com/500?text=Apple+Product'} 
            alt={currentProduct.product_name} 
          />
        </div>
        
        <div className="product-info-detail">
          <h1>{currentProduct.product_name}</h1>
          <div className="product-price-large">{formatPrice(currentProduct.base_price)}</div>
          
          <div className="variant-section">
            <div className="variant-title">Dung lượng</div>
            <div className="variant-options">
              {/* Mocking storage options for UI demo since data might be missing */}
              <button 
                className={`variant-btn ${selectedStorage === '128GB' ? 'selected' : ''}`}
                onClick={() => setSelectedStorage('128GB')}
              >128GB</button>
              <button 
                className={`variant-btn ${selectedStorage === '256GB' ? 'selected' : ''}`}
                onClick={() => setSelectedStorage('256GB')}
              >256GB</button>
            </div>
          </div>

          <div className="variant-section">
            <div className="variant-title">Màu sắc</div>
            <div className="variant-options">
              <button 
                className={`variant-btn ${selectedColor === 'Titan Đen' ? 'selected' : ''}`}
                onClick={() => setSelectedColor('Titan Đen')}
              >Titan Đen</button>
              <button 
                className={`variant-btn ${selectedColor === 'Titan Tự Nhiên' ? 'selected' : ''}`}
                onClick={() => setSelectedColor('Titan Tự Nhiên')}
              >Titan Tự Nhiên</button>
            </div>
          </div>

          <div style={{color: '#999', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.6'}}>
            {currentProduct.description || 'Sản phẩm chính hãng Apple, bảo hành 12 tháng tại các trung tâm bảo hành ủy quyền.'}
          </div>

          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? 'Đang thêm...' : 'THÊM VÀO GIỎ HÀNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
