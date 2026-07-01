import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await api.get('/admin/orders');
      setOrders(data);
    } catch (error) {
      console.error('Lỗi tải danh sách đơn hàng:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(); // Reload after update
    } catch (error) {
      alert('Không thể cập nhật trạng thái đơn hàng!');
      console.error(error);
    }
  };

  const statusColors = {
    'Pending': '#f59e0b',
    'Confirmed': '#3b82f6',
    'Shipping': '#8b5cf6',
    'Delivered': '#10b981',
    'Cancelled': '#ef4444'
  };

  if (isLoading) return <div style={{ color: 'var(--text-muted)' }}>Đang tải danh sách đơn hàng...</div>;

  return (
    <div>
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Mã ĐH</th>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Khách hàng</th>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Tổng tiền</th>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Thanh toán</th>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Trạng thái</th>
              <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '20px', fontWeight: 'bold' }}>#{order.order_id}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: '500' }}>{order.full_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.phone}</div>
                </td>
                <td style={{ padding: '20px', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                  {order.final_amount?.toLocaleString('vi-VN')}đ
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    backgroundColor: order.payment_status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: order.payment_status === 'Paid' ? '#10b981' : '#ef4444'
                  }}>
                    {order.payment_status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    backgroundColor: `${statusColors[order.order_status]}20`,
                    color: statusColors[order.order_status],
                    border: `1px solid ${statusColors[order.order_status]}40`
                  }}>
                    {order.order_status}
                  </span>
                </td>
                <td style={{ padding: '20px' }}>
                  <select 
                    value={order.order_status}
                    onChange={(e) => handleUpdateStatus(order.order_id, e.target.value)}
                    style={{
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipping">Shipping</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Không có đơn hàng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
