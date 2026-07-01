import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Admin.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Product Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    category_id: 1,
    product_name: '',
    description: '',
    base_price: 0,
    status: 'active',
    thumbnail_url: ''
  });

  // Variant Modal state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({
    color: '',
    storage: '',
    sku: '',
    price: 0,
    stock_quantity: 0,
    status: 'active',
    image_url: ''
  });
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { id: 1, name: 'iPhone' },
    { id: 2, name: 'MacBook' },
    { id: 3, name: 'iPad' },
    { id: 4, name: 'Watch' },
    { id: 5, name: 'Âm thanh' },
    { id: 6, name: 'Phụ kiện' }
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?limit=100');
      setProducts(res);
    } catch (err) {
      console.error(err);
      setError('Lỗi lấy danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- PRODUCT LOGIC ---
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditMode(true);
      setCurrentProduct({
        product_id: product.product_id,
        category_id: product.category_id,
        product_name: product.product_name,
        description: product.description,
        base_price: product.base_price,
        status: product.status,
        thumbnail_url: product.thumbnail_url || ''
      });
    } else {
      setEditMode(false);
      setCurrentProduct({ category_id: 1, product_name: '', description: '', base_price: 0, status: 'active', thumbnail_url: '' });
    }
    setShowModal(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/admin/products/${currentProduct.product_id}`, currentProduct);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await api.post('/admin/products', currentProduct);
        alert('Thêm sản phẩm thành công!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleProductFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentProduct(prev => ({ ...prev, thumbnail_url: res.url }));
      alert('Tải ảnh thành công!');
    } catch (err) {
      alert('Lỗi tải ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc muốn vô hiệu hóa sản phẩm này?')) {
      try {
        await api.delete(`/admin/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert('Có lỗi khi xóa!');
      }
    }
  };

  // --- VARIANT LOGIC ---
  const handleOpenVariants = async (product) => {
    setSelectedProduct(product);
    setShowVariantModal(true);
    resetVariantForm();
    await fetchVariants(product.product_id);
  };

  const fetchVariants = async (productId) => {
    try {
      const res = await api.get(`/products/${productId}/variants`);
      setVariants(res);
    } catch (err) {
      console.error('Lỗi lấy biến thể', err);
    }
  };

  const resetVariantForm = () => {
    setEditingVariantId(null);
    setVariantForm({ color: '', storage: '', sku: '', price: 0, stock_quantity: 0, status: 'active', image_url: '' });
  };

  const handleEditVariant = (v) => {
    setEditingVariantId(v.variant_id);
    setVariantForm({
      color: v.color || '',
      storage: v.storage || '',
      sku: v.sku || '',
      price: v.price || 0,
      stock_quantity: v.stock_quantity || 0,
      status: v.status || 'active',
      image_url: v.image_url || ''
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      // NOTE: axios POST with multipart/form-data
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVariantForm(prev => ({ ...prev, image_url: res.url }));
      alert('Tải ảnh thành công!');
    } catch (err) {
      alert('Lỗi tải ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitVariant = async (e) => {
    e.preventDefault();
    try {
      if (editingVariantId) {
        await api.put(`/admin/variants/${editingVariantId}`, variantForm);
        alert('Cập nhật biến thể thành công!');
      } else {
        await api.post(`/admin/products/${selectedProduct.product_id}/variants`, variantForm);
        alert('Thêm biến thể thành công!');
      }
      resetVariantForm();
      fetchVariants(selectedProduct.product_id);
    } catch (err) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteVariant = async (id) => {
    if (window.confirm('Vô hiệu hóa biến thể này?')) {
      try {
        await api.delete(`/admin/variants/${id}`);
        fetchVariants(selectedProduct.product_id);
      } catch (err) {
        alert('Có lỗi khi xóa!');
      }
    }
  };

  if (loading) return <div className="admin-loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <h2>Quản lý Sản phẩm</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Thêm Sản phẩm
        </button>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá gốc</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.product_id}>
                <td>{p.product_id}</td>
                <td>{p.product_name}</td>
                <td>{p.category_name}</td>
                <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.base_price)}</td>
                <td><span className={`status-badge ${p.status === 'active' ? 'status-delivered' : 'status-cancelled'}`}>{p.status}</span></td>
                <td>
                  <button className="action-btn" onClick={() => handleOpenVariants(p)} style={{background:'#10b981', color:'#fff'}}>Biến thể/Ảnh</button>
                  <button className="action-btn edit-btn" onClick={() => handleOpenModal(p)}>Sửa</button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteProduct(p.product_id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL SẢN PHẨM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px'}}>
            <h3>{editMode ? 'Sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}</h3>
            <form onSubmit={handleSubmitProduct}>
              <div className="form-group">
                <label>Tên sản phẩm (*)</label>
                <input type="text" value={currentProduct.product_name} onChange={e => setCurrentProduct({...currentProduct, product_name: e.target.value})} required className="form-input" />
              </div>
              
              <div className="form-group">
                <label>Ảnh đại diện gốc (Tùy chọn)</label>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <input type="file" accept="image/*" onChange={handleProductFileChange} />
                  {uploading && <span style={{color:'#60a5fa'}}>Đang tải...</span>}
                </div>
                {currentProduct.thumbnail_url && (
                  <div style={{marginTop:'10px'}}>
                    <img src={currentProduct.thumbnail_url} alt="Preview" style={{height:'80px', borderRadius:'8px'}}/>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Danh mục (*)</label>
                  <select value={currentProduct.category_id} onChange={e => setCurrentProduct({...currentProduct, category_id: Number(e.target.value)})} className="form-input">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá gốc (*)</label>
                  <input type="number" value={currentProduct.base_price} onChange={e => setCurrentProduct({...currentProduct, base_price: Number(e.target.value)})} required min="0" className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả chi tiết</label>
                <textarea value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="form-input" rows="4" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">{editMode ? 'Lưu thay đổi' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BIẾN THỂ (VARIANTS) */}
      {showVariantModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '900px'}}>
            <h3>Quản lý Biến thể - {selectedProduct?.product_name}</h3>
            
            <div style={{display:'flex', gap: '20px', marginTop:'20px'}}>
              {/* Form thêm/sửa biến thể */}
              <div style={{flex: 1, background:'#1e293b', padding:'15px', borderRadius:'8px'}}>
                <h4>{editingVariantId ? 'Sửa biến thể' : 'Thêm biến thể mới'}</h4>
                <form onSubmit={handleSubmitVariant}>
                  <div className="form-row">
                    <div className="form-group"><label>Màu sắc</label><input type="text" className="form-input" value={variantForm.color} onChange={e=>setVariantForm({...variantForm, color: e.target.value})} /></div>
                    <div className="form-group"><label>Dung lượng</label><input type="text" className="form-input" value={variantForm.storage} onChange={e=>setVariantForm({...variantForm, storage: e.target.value})} placeholder="VD: 256GB" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>SKU (*)</label><input type="text" className="form-input" value={variantForm.sku} onChange={e=>setVariantForm({...variantForm, sku: e.target.value})} required /></div>
                    <div className="form-group"><label>Giá bán (*)</label><input type="number" className="form-input" value={variantForm.price} onChange={e=>setVariantForm({...variantForm, price: Number(e.target.value)})} required min="0"/></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Tồn kho</label><input type="number" className="form-input" value={variantForm.stock_quantity} onChange={e=>setVariantForm({...variantForm, stock_quantity: Number(e.target.value)})} min="0"/></div>
                  </div>
                  <div className="form-group">
                    <label>Ảnh đại diện (Upload)</label>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                      <input type="file" accept="image/*" onChange={handleFileChange} />
                      {uploading && <span style={{color:'#60a5fa'}}>Đang tải...</span>}
                    </div>
                    {variantForm.image_url && (
                      <div style={{marginTop:'10px'}}>
                        <img src={variantForm.image_url} alt="Preview" style={{height:'80px', borderRadius:'8px'}}/>
                      </div>
                    )}
                  </div>
                  <div className="modal-actions" style={{marginTop:'20px'}}>
                    {editingVariantId && <button type="button" className="btn-secondary" onClick={resetVariantForm}>Hủy sửa</button>}
                    <button type="submit" className="btn-primary" disabled={uploading}>Lưu Biến thể</button>
                  </div>
                </form>
              </div>

              {/* Danh sách biến thể */}
              <div style={{flex: 1}}>
                <h4>Danh sách Biến thể</h4>
                <div style={{maxHeight:'500px', overflowY:'auto'}}>
                  {variants.length === 0 && <p>Chưa có biến thể nào.</p>}
                  {variants.map(v => (
                    <div key={v.variant_id} style={{background:'#1e293b', padding:'10px', marginBottom:'10px', borderRadius:'8px', display:'flex', gap:'10px'}}>
                      <div>
                        {v.image_url ? 
                          <img src={v.image_url} alt="thumb" style={{width:'60px', height:'60px', objectFit:'cover', borderRadius:'8px'}}/> :
                          <div style={{width:'60px', height:'60px', background:'#334155', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>No IMG</div>
                        }
                      </div>
                      <div style={{flex:1, fontSize:'14px'}}>
                        <div style={{fontWeight:'bold', color:'#60a5fa'}}>{v.color} - {v.storage}</div>
                        <div>SKU: {v.sku}</div>
                        <div>Giá: {v.price}đ | Kho: {v.stock_quantity}</div>
                      </div>
                      <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                        <button className="action-btn edit-btn" onClick={()=>handleEditVariant(v)}>Sửa</button>
                        <button className="action-btn delete-btn" onClick={()=>handleDeleteVariant(v.variant_id)}>Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{marginTop:'20px', borderTop:'1px solid #334155', paddingTop:'15px'}}>
              <button type="button" className="btn-secondary" onClick={() => setShowVariantModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
