import React, { useEffect } from 'react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cartItems, isLoading, error, fetchCart, removeFromCart } = useCartStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token, fetchCart]);

  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Giỏ hàng</h2>
        <p>Vui lòng <Link to="/login">đăng nhập</Link> để xem giỏ hàng của bạn.</p>
      </div>
    );
  }

  if (isLoading) return <p>Đang tải giỏ hàng...</p>;
  if (error) return <p style={{ color: 'red' }}>Lỗi: {error}</p>;

  return (
    <div>
      <h2>Giỏ hàng của bạn</h2>
      {cartItems.length === 0 ? (
        <p>Giỏ hàng đang trống. <Link to="/products">Tiếp tục mua sắm</Link></p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {cartItems.map((item) => (
            <div key={item._id || item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {item.product?.image && <img src={item.product.image} alt={item.product.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />}
                <div>
                  <h4>{item.product?.name || 'Sản phẩm không xác định'}</h4>
                  <p>Số lượng: {item.quantity}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <p style={{ fontWeight: 'bold' }}>{item.product?.price ? item.product.price * item.quantity : 0}đ</p>
                <button 
                  onClick={() => removeFromCart(item._id || item.id)}
                  style={{ padding: '5px 10px', background: 'red', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '3px' }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button style={{ padding: '10px 20px', background: '#222', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>Thanh toán</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
