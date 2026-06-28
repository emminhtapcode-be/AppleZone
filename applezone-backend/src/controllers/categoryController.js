const { query, sql } = require('../config/db');

// ─── GET /api/categories ─────────────────────────────────────────────────────
async function getCategories(req, res) {
  try {
    const result = await query(
      `SELECT category_id, category_name, slug, status FROM Categories WHERE status = 1`
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[categoryController.getCategories]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/categories/:id ─────────────────────────────────────────────────
async function getCategory(req, res) {
  try {
    const category_id = parseInt(req.params.id);

    const result = await query(
      `SELECT category_id, category_name, slug, status
       FROM Categories
       WHERE category_id = @id AND status = 1`,
      { id: { type: sql.Int, value: category_id } }
    );

    if (!result.recordset.length) {
      return res.status(404).json({ detail: 'Category not found' });
    }

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('[categoryController.getCategory]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── POST /api/categories ────────────────────────────────────────────────────
async function createCategory(req, res) {
  try {
    const { category_name, slug } = req.body;

    if (!category_name || !slug) {
      return res.status(400).json({ detail: 'category_name và slug là bắt buộc' });
    }

    const existing = await query(
      'SELECT category_id FROM Categories WHERE slug = @slug',
      { slug: { type: sql.VarChar(100), value: slug } }
    );
    if (existing.recordset.length) {
      return res.status(400).json({ detail: 'Slug already exists' });
    }

    const result = await query(
      `INSERT INTO Categories (category_name, slug, status)
       OUTPUT INSERTED.category_id, INSERTED.category_name, INSERTED.slug, INSERTED.status
       VALUES (@category_name, @slug, 1)`,
      {
        category_name: { type: sql.NVarChar(100), value: category_name },
        slug:          { type: sql.VarChar(100), value: slug },
      }
    );

    return res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[categoryController.createCategory]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── PUT /api/categories/:id ─────────────────────────────────────────────────
async function updateCategory(req, res) {
  try {
    const category_id = parseInt(req.params.id);
    const { category_name, slug, status } = req.body;

    const existing = await query(
      'SELECT category_id FROM Categories WHERE category_id = @id',
      { id: { type: sql.Int, value: category_id } }
    );
    if (!existing.recordset.length) {
      return res.status(404).json({ detail: 'Category not found' });
    }

    if (slug) {
      const slugCheck = await query(
        'SELECT category_id FROM Categories WHERE slug = @slug AND category_id <> @id',
        {
          slug: { type: sql.VarChar(100), value: slug },
          id:   { type: sql.Int, value: category_id },
        }
      );
      if (slugCheck.recordset.length) {
        return res.status(400).json({ detail: 'Slug already exists' });
      }
    }

    await query(
      `UPDATE Categories
       SET category_name = COALESCE(@category_name, category_name),
           slug = COALESCE(@slug, slug),
           status = COALESCE(@status, status)
       WHERE category_id = @category_id`,
      {
        category_id:   { type: sql.Int, value: category_id },
        category_name: { type: sql.NVarChar(100), value: category_name !== undefined ? category_name : null },
        slug:          { type: sql.VarChar(100), value: slug !== undefined ? slug : null },
        status:        { type: sql.Bit, value: status !== undefined ? status : null },
      }
    );

    return res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('[categoryController.updateCategory]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── DELETE /api/categories/:id ──────────────────────────────────────────────
async function deleteCategory(req, res) {
  try {
    const category_id = parseInt(req.params.id);

    const result = await query(
      'UPDATE Categories SET status = 0 WHERE category_id = @category_id',
      { category_id: { type: sql.Int, value: category_id } }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ detail: 'Category not found' });
    }

    return res.json({ message: 'Category deleted successfully (soft delete)' });
  } catch (err) {
    console.error('[categoryController.deleteCategory]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
