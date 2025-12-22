const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// List returns (optional status filter)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let query = 'SELECT * FROM returns';
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ returns: rows });
  } catch (e) {
    console.error('Error fetching returns:', e);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Create a new return request
router.post('/', async (req, res) => {
  try {
    const { order_id, product_id, product_name, quantity, reason, requested_by } = req.body;
    if (!order_id || !product_id || !product_name || !quantity) {
      return res.status(400).json({ error: 'order_id, product_id, product_name, quantity are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO returns (order_id, product_id, product_name, quantity, reason, status, requested_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [order_id, product_id, product_name, quantity, reason || null, requested_by || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Return request submitted' });
  } catch (e) {
    console.error('Error creating return:', e.message, e.sql);
    res.status(500).json({ error: e.message || 'Failed to create return' });
  }
});

// Update return status (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(String(status))) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT * FROM returns WHERE id = ?', [id]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Return not found' });
    }
    const r = rows[0];

    // If approving, restock the product
    if (r.status !== 'approved' && status === 'approved') {
      await connection.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [r.quantity, r.product_id]);
    }

    // Update status and review metadata
    try {
      await connection.query(
        'UPDATE returns SET status = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() WHERE id = ?',
        [status, req.user?.email || req.user?.sub || null, id]
      );
    } catch (err) {
      console.warn('Review columns not available, updating with fallback:', err.message);
      await connection.query(
        'UPDATE returns SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Return updated' });
  } catch (e) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error('Error rolling back transaction:', rollbackErr.message);
    }
    console.error('Error updating return:', e.message, e.sql);
    res.status(500).json({ error: e.message || 'Failed to update return' });
  } finally {
    connection.release();
  }
});

module.exports = router;
