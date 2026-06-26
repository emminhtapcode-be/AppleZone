const { query, sql } = require('../config/db');

// ─── GET /api/v1/products ─────────────────────────────────────────────────────
async function getProducts(req, res) {
  try {
    const category_id = req.query.category_id ? parseInt(req.query.category_id) : null;
    const search      = req.query.search || null;
    const skip        = parseInt(req.query.skip)  || 0;
    const limit       = Math.min(parseInt(req.query.limit) || 20, 100);

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

    params.skip  = { type: sql.Int, value: skip };
    params.limit = { type: sql.Int, value: limit };

    const result = await query(
      `SELECT
         p.product_id, p.category_id, p.product_name, p.thumbnail_url,
         p.description, CAST(p.base_price AS FLOAT) AS base_price, p.status,
         c.category_name,
         (
           SELECT v.variant_id, v.color, v.storage, v.sku,
                  CAST(v.price AS FLOAT) AS price, v.stock_quantity, v.status
           FROM product_variants v
           WHERE v.product_id = p.product_id AND v.status = 1
           FOR JSON PATH
         ) AS variants
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
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

// ─── GET /api/v1/products/:id ─────────────────────────────────────────────────
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
                    SELECT i.image_id, i.image_url, i.is_primary
                    FROM product_images i
                    WHERE i.variant_id = v.variant_id
                    FOR JSON PATH
                  ) AS images
           FROM product_variants v
           WHERE v.product_id = p.product_id
           FOR JSON PATH
         ) AS variants
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
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

module.exports = { getProducts, getProduct };
