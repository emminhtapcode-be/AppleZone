const { query, sql } = require('../config/db');

// ─── GET /api/v1/cart ─────────────────────────────────────────────────────────
async function getCart(req, res) {
  try {
    const user_id = req.user.user_id;

    const result = await query(
      `SELECT
         c.cart_id,
         ci.cart_item_id,
         ci.variant_id,
         ci.quantity,
         v.color, v.storage, v.sku,
         CAST(v.price AS FLOAT)  AS price,
         v.stock_quantity,
         p.product_id, p.product_name, p.thumbnail_url
       FROM carts c
       LEFT JOIN cart_items       ci ON ci.cart_id    = c.cart_id
       LEFT JOIN product_variants  v  ON v.variant_id  = ci.variant_id
       LEFT JOIN products          p  ON p.product_id  = v.product_id
       WHERE c.user_id = @user_id`,
      { user_id: { type: sql.Int, value: user_id } }
    );

    if (!result.recordset.length || result.recordset[0].cart_id === null) {
      return res.json({ cart_id: null, items: [] });
    }

    const cart_id = result.recordset[0].cart_id;
    const items = result.recordset
      .filter(r => r.cart_item_id !== null)
      .map(r => ({
        cart_item_id:  r.cart_item_id,
        variant_id:    r.variant_id,
        quantity:      r.quantity,
        color:         r.color,
        storage:       r.storage,
        sku:           r.sku,
        price:         r.price,
        stock_quantity: r.stock_quantity,
        product_id:    r.product_id,
        product_name:  r.product_name,
        thumbnail_url: r.thumbnail_url,
      }));

    return res.json({ cart_id, items });
  } catch (err) {
    console.error('[cartController.getCart]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── POST /api/v1/cart/items ──────────────────────────────────────────────────
async function addToCart(req, res) {
  try {
    const user_id            = req.user.user_id;
    const { variant_id, quantity } = req.body;

    if (!variant_id || !quantity || quantity < 1) {
      return res.status(400).json({ detail: 'variant_id và quantity (>= 1) là bắt buộc' });
    }

    // Lấy hoặc tạo cart
    let cartResult = await query(
      'SELECT cart_id FROM carts WHERE user_id = @user_id',
      { user_id: { type: sql.Int, value: user_id } }
    );

    let cart_id;
    if (!cartResult.recordset.length) {
      const newCart = await query(
        'INSERT INTO carts (user_id) OUTPUT INSERTED.cart_id VALUES (@user_id)',
        { user_id: { type: sql.Int, value: user_id } }
      );
      cart_id = newCart.recordset[0].cart_id;
    } else {
      cart_id = cartResult.recordset[0].cart_id;
    }

    // Upsert item
    const existing = await query(
      'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = @cart_id AND variant_id = @variant_id',
      {
        cart_id:    { type: sql.Int, value: cart_id },
        variant_id: { type: sql.Int, value: variant_id },
      }
    );

    if (existing.recordset.length) {
      const newQty = existing.recordset[0].quantity + quantity;
      await query(
        'UPDATE cart_items SET quantity = @qty WHERE cart_item_id = @id',
        {
          qty: { type: sql.Int, value: newQty },
          id:  { type: sql.Int, value: existing.recordset[0].cart_item_id },
        }
      );
    } else {
      await query(
        'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (@cart_id, @variant_id, @quantity)',
        {
          cart_id:    { type: sql.Int, value: cart_id },
          variant_id: { type: sql.Int, value: variant_id },
          quantity:   { type: sql.Int, value: quantity },
        }
      );
    }

    return res.json({ message: 'Added to cart' });
  } catch (err) {
    console.error('[cartController.addToCart]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── DELETE /api/v1/cart/items/:id ────────────────────────────────────────────
async function removeCartItem(req, res) {
  try {
    const item_id = parseInt(req.params.id);

    const result = await query(
      'DELETE FROM cart_items WHERE cart_item_id = @id',
      { id: { type: sql.Int, value: item_id } }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ detail: 'Item not found' });
    }

    return res.json({ message: 'Removed' });
  } catch (err) {
    console.error('[cartController.removeCartItem]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = { getCart, addToCart, removeCartItem };
