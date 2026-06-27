import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>404 - Không tìm thấy trang</h2>
      <p>Xin lỗi, trang bạn đang tìm kiếm không tồn tại.</p>
      <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>Quay lại trang chủ</Link>
    </div>
  );
};

export default NotFound;
