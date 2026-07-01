import React, { useEffect } from 'react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Cart.css';

const Cart = () => {
  const { cartItems, isLoading, error, fetchCart, removeFromCart } = useCartStore();
  const { token } = useAuthStore();
  const [isProcessing, setIsProcessing] = React.useState(false);

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token, fetchCart]);

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      const items = cartItems.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      }));
      
      const orderRes = await api.post('/orders', {
        shipping_address_id: -1, // Bypass
        items: items
      });
      
      const order_id = orderRes.order_id;
      if (order_id) {
        // Request VNPay URL
        const paymentRes = await api.post('/payments/vnpay/create_payment_url', { order_id });
        if (paymentRes.paymentUrl) {
          window.location.href = paymentRes.paymentUrl;
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!token) {
    return (
      <div className="cart-page container">
        <div className="cart-empty glass-panel">
          <h2>Giỏ hàng</h2>
          <p>Vui lòng <Link to="/login" className="text-link">đăng nhập</Link> để xem giỏ hàng của bạn.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="cart-page container"><p className="loading-text">Đang tải giỏ hàng...</p></div>;
  if (error) return <div className="cart-page container"><p className="error-text" style={{color: 'red', marginTop: '40px'}}>Lỗi: {error}</p></div>;

  return (
    <div className="cart-page container">
      <h2 className="cart-title">Giỏ hàng của bạn</h2>
      {cartItems.length === 0 ? (
        <div className="cart-empty glass-panel">
          <p>Giỏ hàng đang trống.</p>
          <Link to="/products" className="btn-primary mt-4 inline-block">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.cart_item_id} className="cart-item glass-card">
                <div className="cart-item-info">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.product_name} className="cart-item-img" />
                  ) : (
                    <div className="cart-item-img-placeholder">Ảnh</div>
                  )}
                  <div>
                    <h4 className="cart-item-name">{item.product_name || 'Sản phẩm'} {item.storage ? `(${item.storage})` : ''}</h4>
                    <p className="cart-item-quantity">Số lượng: {item.quantity} {item.color ? `- Màu: ${item.color}` : ''}</p>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <p className="cart-item-price">{item.price ? (item.price * item.quantity).toLocaleString('vi-VN') : 0}đ</p>
                  <button 
                    onClick={() => removeFromCart(item.cart_item_id)}
                    className="btn-remove"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary glass-panel">
            <h3>Tổng cộng</h3>
            <div className="summary-row">
              <span>Tạm tính</span>
              <span>{cartItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0).toLocaleString('vi-VN')}đ</span>
            </div>
            <button 
              className="btn-primary full-width mt-4" 
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Thanh toán VNPay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
