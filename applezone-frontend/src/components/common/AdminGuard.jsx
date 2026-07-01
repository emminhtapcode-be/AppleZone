import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const AdminGuard = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', color: 'white' }}>Đang kiểm tra quyền truy cập...</div>;
  }

  if (!user || (user.role?.toLowerCase() !== 'admin' && user.role?.toLowerCase() !== 'staff')) {
    // If not logged in or not admin, redirect to home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;
