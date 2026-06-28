const { query, sql } = require('../config/db');

// ─── GET /api/products ────────────────────────────────────────────────────────
async function getProducts(req, res) {
  try {
    const category_id = req.query.category_id ? parseInt(req.query.category_id) : null;
    const search = req.query.search || null;
    const skip = parseInt(req.query.skip) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    let where = 'WHERE p.status = 1';
    const params = {};

    if (category_id) {
      where += ' AND p.category_id = @category_id';
      params.category_id = { type: sql.Int, value: category_id };
    }
    if (search) {
      where += ' AND p.product_name LIKE @search';
      params.search = { type: sql.NVarChar, value: `%${search}%` };
    }

    params.skip = { type: sql.Int, value: skip };
    params.limit = { type: sql.Int, value: limit };

    const result = await query(
      `SELECT
         p.product_id, p.category_id, p.product_name, p.thumbnail_url,
         p.description, CAST(p.base_price AS FLOAT) AS base_price, p.status,
         c.category_name,
         (
           SELECT v.variant_id, v.color, v.storage, v.sku,
                  CAST(v.price AS FLOAT) AS price, v.stock_quantity, v.status
           FROM ProductVariants v
           WHERE v.product_id = p.product_id AND v.status = 1
           FOR JSON PATH
         ) AS variants
       FROM Products p
       LEFT JOIN Categories c ON c.category_id = p.category_id
       ${where}
       ORDER BY p.product_id
       OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`,
      params
    );

    const products = result.recordset.map(row => ({
      ...row,
      variants: row.variants ? JSON.parse(row.variants) : [],
    }));

    return res.json(products);
  } catch (err) {
    console.error('[productController.getProducts]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/products/:id ────────────────────────────────────────────────────
async function getProduct(req, res) {
  try {
    const product_id = parseInt(req.params.id);

    const result = await query(
      `SELECT
         p.product_id, p.category_id, p.product_name, p.thumbnail_url,
         p.description, CAST(p.base_price AS FLOAT) AS base_price, p.status,
         c.category_name,
         (
           SELECT v.variant_id, v.color, v.storage, v.sku,
                  CAST(v.price AS FLOAT) AS price, v.stock_quantity, v.status,
                  (
                     SELECT i.image_id, i.image_url, i.is_primary -- 1. ĐỔI THÀNH is_primary
                     FROM ProductImages i
                     WHERE i.variant_id = v.variant_id        -- 2. SỬA THÀNH KẾT NỐI QUA variant_id
                     FOR JSON PATH
                  ) AS images
           FROM ProductVariants v
           WHERE v.product_id = p.product_id
           FOR JSON PATH
         ) AS variants
       FROM Products p
       LEFT JOIN Categories c ON c.category_id = p.category_id
       WHERE p.product_id = @id AND p.status = 1`,
      { id: { type: sql.Int, value: product_id } }
    );

    if (!result.recordset.length) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    const row = result.recordset[0];
    const product = {
      ...row,
      variants: row.variants ? JSON.parse(row.variants) : [],
    };
    product.variants = product.variants.map(v => ({
      ...v,
      images: v.images ? (typeof v.images === 'string' ? JSON.parse(v.images) : v.images) : [],
    }));

    return res.json(product);
  } catch (err) {
    console.error('[productController.getProduct]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}
// ─── GET /api/products/:id/variants ───────────────────────────────────────────
async function getProductVariants(req, res) {
  try {
    const product_id = parseInt(req.params.id);
    const result = await query(
      `SELECT variant_id, product_id, color, storage, sku, CAST(price AS FLOAT) AS price, stock_quantity, status
       FROM ProductVariants
       WHERE product_id = @product_id AND status = 1`,
      { product_id: { type: sql.Int, value: product_id } }
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[productController.getProductVariants]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/products/category/:catId ────────────────────────────────────────
async function getProductsByCategory(req, res) {
  try {
    const catId = parseInt(req.params.catId);
    const result = await query(
      `SELECT
         p.product_id, p.category_id, p.product_name, p.thumbnail_url,
         p.description, CAST(p.base_price AS FLOAT) AS base_price, p.status,
         c.category_name,
         (
           SELECT v.variant_id, v.color, v.storage, v.sku,
                  CAST(v.price AS FLOAT) AS price, v.stock_quantity, v.status
           FROM ProductVariants v
           WHERE v.product_id = p.product_id AND v.status = 1
           FOR JSON PATH
         ) AS variants
       FROM Products p
       LEFT JOIN Categories c ON c.category_id = p.category_id
       WHERE p.category_id = @catId AND p.status = 1`,
      { catId: { type: sql.Int, value: catId } }
    );

    const products = result.recordset.map(row => ({
      ...row,
      variants: row.variants ? JSON.parse(row.variants) : [],
    }));

    return res.json(products);
  } catch (err) {
    console.error('[productController.getProductsByCategory]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── POST /api/admin/products ────────────────────────────────────────────────
async function createProduct(req, res) {
  try {
    const { category_id, product_name, thumbnail_url, description, base_price } = req.body;
    if (!product_name || !category_id) {
      return res.status(400).json({ detail: 'product_name và category_id là bắt buộc' });
    }

    const result = await query(
      `INSERT INTO Products (category_id, product_name, thumbnail_url, description, base_price, status)
       OUTPUT INSERTED.product_id, INSERTED.category_id, INSERTED.product_name, INSERTED.thumbnail_url,
              INSERTED.description, CAST(INSERTED.base_price AS FLOAT) AS base_price, INSERTED.status
       VALUES (@category_id, @product_name, @thumbnail_url, @description, @base_price, 1)`,
      {
        category_id: { type: sql.Int, value: category_id },
        product_name: { type: sql.NVarChar(100), value: product_name },
        thumbnail_url: { type: sql.VarChar(255), value: thumbnail_url || null },
        description: { type: sql.NVarChar(sql.MAX), value: description || null },
        base_price: { type: sql.Decimal(18, 2), value: base_price || 0 },
      }
    );

    return res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[productController.createProduct]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── PUT /api/admin/products/:id ─────────────────────────────────────────────
async function updateProduct(req, res) {
  try {
    const product_id = parseInt(req.params.id);
    const { category_id, product_name, thumbnail_url, description, base_price, status } = req.body;

    const existing = await query('SELECT product_id FROM Products WHERE product_id = @id', { id: { type: sql.Int, value: product_id } });
    if (!existing.recordset.length) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    await query(
      `UPDATE Products
       SET category_id = COALESCE(@category_id, category_id),
           product_name = COALESCE(@product_name, product_name),
           thumbnail_url = COALESCE(@thumbnail_url, thumbnail_url),
           description = COALESCE(@description, description),
           base_price = COALESCE(@base_price, base_price),
           status = COALESCE(@status, status)
       WHERE product_id = @product_id`,
      {
        product_id: { type: sql.Int, value: product_id },
        category_id: { type: sql.Int, value: category_id !== undefined ? category_id : null },
        product_name: { type: sql.NVarChar(100), value: product_name !== undefined ? product_name : null },
        thumbnail_url: { type: sql.VarChar(255), value: thumbnail_url !== undefined ? thumbnail_url : null },
        description: { type: sql.NVarChar(sql.MAX), value: description !== undefined ? description : null },
        base_price: { type: sql.Decimal(18, 2), value: base_price !== undefined ? base_price : null },
        status: { type: sql.Bit, value: status !== undefined ? status : null },
      }
    );

    return res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('[productController.updateProduct]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── DELETE /api/admin/products/:id ──────────────────────────────────────────
async function deleteProduct(req, res) {
  try {
    const product_id = parseInt(req.params.id);
    const result = await query(
      `UPDATE Products SET status = 0 WHERE product_id = @product_id`,
      { product_id: { type: sql.Int, value: product_id } }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    return res.json({ message: 'Product deleted successfully (soft delete)' });
  } catch (err) {
    console.error('[productController.deleteProduct]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = {
  getProducts,
  getProduct,
  getProductVariants,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
};
