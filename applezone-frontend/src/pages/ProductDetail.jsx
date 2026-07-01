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

  useEffect(() => {
    if (currentProduct?.variants?.length) {
      const storages = [...new Set(currentProduct.variants.map(v => v.storage).filter(Boolean))];
      const colors = [...new Set(currentProduct.variants.map(v => v.color).filter(Boolean))];
      if (storages.length > 0 && !selectedStorage) setSelectedStorage(storages[0]);
      if (colors.length > 0 && !selectedColor) setSelectedColor(colors[0]);
    }
  }, [currentProduct, selectedStorage, selectedColor]);

  const handleAddToCart = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    const variant = currentProduct?.variants?.find(v => v.color === selectedColor && v.storage === selectedStorage) 
                  || currentProduct?.variants?.[0];
                  
    if (!variant) {
      alert('Sản phẩm chưa có biến thể nào.');
      return;
    }
    
    await addToCart(variant.variant_id, 1);
    alert('Đã thêm vào giỏ hàng!');
  };

  if (isLoading) return <p style={{textAlign: 'center', color: '#999', marginTop: '40px'}}>Đang tải thông tin sản phẩm...</p>;
  if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: '40px' }}>Lỗi: {error}</p>;
  if (!currentProduct) return <p style={{textAlign: 'center', color: '#999', marginTop: '40px'}}>Không tìm thấy sản phẩm.</p>;

  const formatPrice = (p) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
  };

  const storages = [...new Set((currentProduct?.variants || []).map(v => v.storage).filter(Boolean))];
  const colors = [...new Set((currentProduct?.variants || []).map(v => v.color).filter(Boolean))];

  // Get current variant to show accurate price if selected
  const activeVariant = currentProduct?.variants?.find(v => v.color === selectedColor && v.storage === selectedStorage) || currentProduct?.variants?.[0];
  const displayPrice = activeVariant?.price || currentProduct?.base_price;

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
          <div className="product-price-large">{formatPrice(displayPrice)}</div>
          
          {storages.length > 0 && (
            <div className="variant-section">
              <div className="variant-title">Dung lượng</div>
              <div className="variant-options">
                {storages.map(storage => (
                  <button 
                    key={storage}
                    className={`variant-btn ${selectedStorage === storage ? 'selected' : ''}`}
                    onClick={() => setSelectedStorage(storage)}
                  >{storage}</button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="variant-section">
              <div className="variant-title">Màu sắc</div>
              <div className="variant-options">
                {colors.map(color => (
                  <button 
                    key={color}
                    className={`variant-btn ${selectedColor === color ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(color)}
                  >{color}</button>
                ))}
              </div>
            </div>
          )}

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
