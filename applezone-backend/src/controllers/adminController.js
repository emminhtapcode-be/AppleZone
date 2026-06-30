const { query, sql } = require('../config/db');

// ─── GET /api/admin/reports/revenue ───────────────────────────────────────
async function getRevenueReport(req, res) {
  try {
    const result = await query('SELECT * FROM vw_DoanhThuThang ORDER BY nam DESC, thang DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy báo cáo doanh thu', error: err.message });
  }
}

// ─── GET /api/admin/reports/best-selling ──────────────────────────────────
async function getBestSellingProducts(req, res) {
  try {
    const result = await query('SELECT TOP 10 * FROM vw_BanChay ORDER BY tong_ban DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy sản phẩm bán chạy', error: err.message });
  }
}

// ─── GET /api/admin/reports/low-stock ─────────────────────────────────────
async function getLowStockVariants(req, res) {
  try {
    const result = await query('SELECT * FROM vw_SapHetHang ORDER BY stock_quantity ASC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy hàng sắp hết', error: err.message });
  }
}

// ─── GET /api/admin/inventory ─────────────────────────────────────────────
async function getInventory(req, res) {
  try {
    const queryStr = `
      SELECT pv.variant_id, p.product_name, pv.color, pv.storage, pv.sku, pv.stock_quantity, pv.status
      FROM ProductVariants pv
      JOIN Products p ON pv.product_id = p.product_id
      ORDER BY p.product_name, pv.color, pv.storage
    `;
    const result = await query(queryStr);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy thông tin tồn kho', error: err.message });
  }
}

// ─── PUT /api/admin/inventory/:variantId ──────────────────────────────────
async function updateInventory(req, res) {
  try {
    const variantId = req.params.variantId;
    const { stock_quantity } = req.body;

    if (stock_quantity === undefined || stock_quantity < 0) {
      return res.status(400).json({ message: 'Số lượng tồn kho không hợp lệ' });
    }

    const queryStr = `
      UPDATE ProductVariants 
      SET stock_quantity = @stock_quantity 
      WHERE variant_id = @variant_id
    `;
    const params = {
      stock_quantity: { type: sql.Int, value: stock_quantity },
      variant_id: { type: sql.Int, value: variantId }
    };

    const result = await query(queryStr, params);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy biến thể' });
    }

    res.json({ message: 'Cập nhật tồn kho thành công', variant_id: variantId, stock_quantity });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật tồn kho', error: err.message });
  }
}

module.exports = {
  getRevenueReport,
  getBestSellingProducts,
  getLowStockVariants,
  getInventory,
  updateInventory
};
