import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import './Profile.css';

const Profile = () => {
  const { user, token, logout } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="profile-page container">
      <div className="profile-card glass-panel">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="profile-title">
            <h2>{user?.full_name || 'Đang cập nhật...'}</h2>
            <p className="role-badge">{user?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</p>
          </div>
        </div>
        
        <div className="profile-body">
          <div className="info-group">
            <label>Họ và tên</label>
            <div className="info-value">{user?.full_name || 'Đang cập nhật...'}</div>
          </div>
          <div className="info-group">
            <label>Email</label>
            <div className="info-value">{user?.email || 'Đang cập nhật...'}</div>
          </div>
        </div>
        
        <div className="profile-actions">
          <button onClick={logout} className="btn-logout">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
