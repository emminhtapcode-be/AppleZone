import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Admin.css';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/inventory');
      setInventory(res);
    } catch (err) {
      console.error(err);
      setError('Lỗi lấy danh sách tồn kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockChange = (variantId, newQuantity) => {
    setInventory(prev => 
      prev.map(item => 
        item.variant_id === variantId ? { ...item, stock_quantity: Number(newQuantity) } : item
      )
    );
  };

  const handleUpdate = async (variantId, currentStock) => {
    try {
      setUpdatingId(variantId);
      await api.put(`/admin/inventory/${variantId}`, { stock_quantity: currentStock });
      alert('Cập nhật tồn kho thành công!');
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật tồn kho: ' + (err.response?.data?.message || err.message));
      // Re-fetch to reset
      fetchInventory();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="admin-loading">Đang tải dữ liệu tồn kho...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <h2>Quản lý Tồn kho (Inventory)</h2>
        <button className="btn-secondary" onClick={fetchInventory}>
          Làm mới
        </button>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã sản phẩm (SKU)</th>
              <th>Tên sản phẩm</th>
              <th>Màu sắc</th>
              <th>Dung lượng</th>
              <th>Tồn kho hiện tại</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.variant_id} className={item.stock_quantity <= 5 ? 'low-stock-row' : ''}>
                <td>{item.sku}</td>
                <td>{item.product_name}</td>
                <td>{item.color}</td>
                <td>{item.storage || '-'}</td>
                <td>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input stock-input" 
                    value={item.stock_quantity}
                    onChange={(e) => handleStockChange(item.variant_id, e.target.value)}
                    style={{width: '100px', padding: '5px 10px'}}
                  />
                  {item.stock_quantity <= 5 && <span className="low-stock-warning" style={{color:'red', marginLeft:'10px', fontSize:'12px'}}>Sắp hết!</span>}
                </td>
                <td>
                  <button 
                    className="btn-primary" 
                    style={{padding: '5px 15px'}}
                    onClick={() => handleUpdate(item.variant_id, item.stock_quantity)}
                    disabled={updatingId === item.variant_id}
                  >
                    {updatingId === item.variant_id ? 'Đang lưu...' : 'Cập nhật'}
                  </button>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Không có dữ liệu tồn kho.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
