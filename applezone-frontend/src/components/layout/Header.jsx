import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={{ padding: '1rem', background: '#222', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="logo">
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          AppleZone
        </Link>
      </div>
      <nav>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0, padding: 0 }}>
          <li><Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Trang chủ</Link></li>
          <li><Link to="/products" style={{ color: '#fff', textDecoration: 'none' }}>Sản phẩm</Link></li>
          <li><Link to="/cart" style={{ color: '#fff', textDecoration: 'none' }}>Giỏ hàng</Link></li>
          <li><Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Đăng nhập</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
