const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../db');

// List products
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '20', 10), 100);
    const offset = (page - 1) * pageSize;
    const q = (req.query.q || '').toString().trim();

    let where = '';
    let params = [];
    if (q) {
      where = 'WHERE name LIKE ? OR category LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }

    const [rows] = await pool.query(
      `SELECT SQL_CALC_FOUND_ROWS id, name, category, price, cost_price, quantity, image_url FROM products ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const [countRows] = await pool.query('SELECT FOUND_ROWS() as total');
    const total = countRows[0].total;
    res.json({ items: rows, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
router.post('/', async (req, res) => {
  const { name, category, price, quantity = 0, image_url = null, barcode = null, tax = null, cost_price = null, added_by = null } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'name, category, price are required' });
  }
  try {
    const id = crypto.randomUUID();
    const [result] = await pool.query(
      'INSERT INTO products (id, name, category, price, quantity, image_url, barcode, tax, cost_price, added_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [id, name, category, price, quantity, image_url, barcode, tax, cost_price, added_by]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = ['name','category','price','quantity','image_url','barcode','tax','cost_price'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  try {
    values.push(id);
    await pool.query(`UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
