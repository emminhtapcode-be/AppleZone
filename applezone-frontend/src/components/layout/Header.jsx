import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const Header = () => {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{ padding: '1rem', background: '#222', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="logo">
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          AppleZone
        </Link>
      </div>
      <nav>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0, padding: 0, alignItems: 'center' }}>
          <li><Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Trang chủ</Link></li>
          <li><Link to="/products" style={{ color: '#fff', textDecoration: 'none' }}>Sản phẩm</Link></li>
          <li><Link to="/cart" style={{ color: '#fff', textDecoration: 'none' }}>Giỏ hàng</Link></li>
          
          {token ? (
            <>
              <li style={{ color: '#aaa' }}>Xin chào, {user?.username || 'Bạn'}</li>
              <li>
                <button 
                  onClick={handleLogout} 
                  style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}
                >
                  Đăng xuất
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Đăng nhập</Link></li>
              <li><Link to="/register" style={{ color: '#fff', textDecoration: 'none', border: '1px solid #fff', padding: '5px 10px', borderRadius: '3px' }}>Đăng ký</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
