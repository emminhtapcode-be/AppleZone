import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import './Header.css';

const Header = () => {
  const { token, user, logout } = useAuthStore();
  const { cartItems = [] } = useCartStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/" className="logo-link">
            <span className="logo-text">Top<span className="logo-zone">Zone</span></span>
          </Link>
        </div>

        <nav>
          <ul className="nav-links">
            <li><Link to="/products?category=iphone" className="nav-item">iPhone</Link></li>
            <li><Link to="/products?category=mac" className="nav-item">Mac</Link></li>
            <li><Link to="/products?category=ipad" className="nav-item">iPad</Link></li>
            <li><Link to="/products?category=watch" className="nav-item">Watch</Link></li>
            <li><Link to="/products?category=sound" className="nav-item">Âm thanh</Link></li>
            <li><Link to="/products?category=accessories" className="nav-item">Phụ kiện</Link></li>
          </ul>
        </nav>

        <div className="header-actions">
          {token ? (
            <>
              <span className="user-greeting">Hi, {user?.full_name || user?.username || 'Bạn'}</span>
              <button onClick={handleLogout} className="icon-btn" title="Đăng xuất">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </>
          ) : (
            <Link to="/login" className="icon-btn" title="Đăng nhập">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </Link>
          )}
          
          <Link to="/cart" className="icon-btn" title="Giỏ hàng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {totalCartItems > 0 && <span className="cart-badge">{totalCartItems}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
