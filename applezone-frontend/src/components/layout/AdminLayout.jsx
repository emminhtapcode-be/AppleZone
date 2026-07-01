import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: 'fas fa-chart-line' },
    { name: 'Đơn hàng', path: '/admin/orders', icon: 'fas fa-box' },
    { name: 'Sản phẩm', path: '/admin/products', icon: 'fas fa-laptop' },
    { name: 'Tồn kho', path: '/admin/inventory', icon: 'fas fa-warehouse' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link to="/">
            Apple<span>Zone</span>
          </Link>
          <div className="admin-badge">ADMIN</div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={item.icon}></i>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="admin-user-menu">
          <div className="admin-user-info">
            <img src={user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.full_name || 'Admin') + '&background=random'} alt="avatar" className="admin-avatar" />
            <div>
              <p className="admin-name">{user?.full_name}</p>
              <p className="admin-role">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { logout(); window.location.href = '/login'; }} className="admin-logout-btn">
            <i className="fas fa-sign-out-alt"></i> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h2>
            {navItems.find(item => item.path === location.pathname)?.name || 'Trang quản trị'}
          </h2>
          <Link to="/" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            Về trang mua hàng
          </Link>
        </header>
        
        <div className="admin-content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
