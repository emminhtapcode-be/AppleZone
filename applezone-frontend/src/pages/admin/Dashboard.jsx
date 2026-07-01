import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const [revenue, setRevenue] = useState(null);
  const [bestSelling, setBestSelling] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [revRes, bestRes] = await Promise.all([
          api.get('/admin/reports/revenue'),
          api.get('/admin/reports/best-selling')
        ]);
        setRevenue(revRes[0] || { total_revenue: 0, total_orders: 0 });
        setBestSelling(bestRes || []);
      } catch (error) {
        console.error('Lỗi tải Dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) return <div style={{ color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>TỔNG DOANH THU</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
            {revenue?.total_revenue?.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>TỔNG SỐ ĐƠN HÀNG</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700' }}>
            {revenue?.total_orders} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>đơn</span>
          </p>
        </div>
      </div>

      <h3 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Sản phẩm bán chạy nhất</h3>
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}>Sản phẩm</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}>Biến thể</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}>Đã bán</th>
            </tr>
          </thead>
          <tbody>
            {bestSelling.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px' }}>{item.product_name}</td>
                <td style={{ padding: '16px' }}>
                  {item.storage && <span style={{ marginRight: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>{item.storage}</span>}
                  {item.color && <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>{item.color}</span>}
                </td>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>{item.total_sold}</td>
              </tr>
            ))}
            {bestSelling.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có dữ liệu bán hàng.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
