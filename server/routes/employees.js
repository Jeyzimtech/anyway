const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../db');

// Get active employees today
router.get('/active-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get user activity with sales data
    const [rows] = await pool.query(`
      SELECT 
        ua.id,
        u.id as user_id,
        u.full_name as username,
        u.email,
        u.role,
        ua.logged_in_at,
        ua.logged_out_at,
        DATE_FORMAT(ua.logged_in_at, '%Y-%m-%d') as date,
        DATE_FORMAT(ua.logged_in_at, '%h:%i %p') as login_time_formatted,
        DATE_FORMAT(ua.logged_out_at, '%h:%i %p') as logout_time_formatted,
        COUNT(DISTINCT o.id) as orders_count,
        CAST(COALESCE(SUM(oi.quantity), 0) AS UNSIGNED) as quantity_sold
      FROM user_activity ua
      LEFT JOIN users u ON ua.user_id = u.id
      LEFT JOIN orders o ON DATE(o.created_at) = DATE(ua.logged_in_at) 
        AND o.created_at BETWEEN ua.logged_in_at AND COALESCE(ua.logged_out_at, NOW())
        AND o.status = 'completed'
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE DATE(ua.logged_in_at) = ? AND ua.is_active = TRUE
      GROUP BY ua.id, u.id, u.full_name, u.email, u.role, ua.logged_in_at, ua.logged_out_at
      ORDER BY ua.logged_in_at DESC
    `, [today]);
    
    res.json({ employees: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch employee activity' });
  }
});

// Log employee login
router.post('/login', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }
  
  try {
    const id = crypto.randomUUID();
    const [result] = await pool.query(
      'INSERT INTO employee_activity (id, username, login_time, quantity_sold, created_at) VALUES (?, ?, NOW(), 0, NOW())',
      [id, username]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log login' });
  }
});

// Log employee logout
router.put('/logout/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query(
      'UPDATE employee_activity SET logout_time = NOW(), updated_at = NOW() WHERE id = ?',
      [id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log logout' });
  }
});

// Update quantity sold
router.put('/quantity/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity_sold } = req.body;
  
  try {
    await pool.query(
      'UPDATE employee_activity SET quantity_sold = ?, updated_at = NOW() WHERE id = ?',
      [quantity_sold, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update quantity sold' });
  }
});

// Get logged out employees (sessions that ended) today
router.get('/loggedout-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.query(`
      SELECT 
        ua.id,
        u.id as user_id,
        u.full_name as username,
        u.email,
        u.role,
        ua.logged_in_at,
        ua.logged_out_at,
        DATE_FORMAT(ua.logged_in_at, '%Y-%m-%d') as date,
        DATE_FORMAT(ua.logged_in_at, '%h:%i %p') as login_time_formatted,
        DATE_FORMAT(ua.logged_out_at, '%h:%i %p') as logout_time_formatted,
        COUNT(DISTINCT o.id) as orders_count,
        CAST(COALESCE(SUM(oi.quantity), 0) AS UNSIGNED) as quantity_sold
      FROM user_activity ua
      LEFT JOIN users u ON ua.user_id = u.id
      LEFT JOIN orders o ON DATE(o.created_at) = DATE(ua.logged_in_at) 
        AND o.created_at BETWEEN ua.logged_in_at AND COALESCE(ua.logged_out_at, NOW())
        AND o.status = 'completed'
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE DATE(ua.logged_out_at) = ? AND ua.logged_out_at IS NOT NULL
      GROUP BY ua.id, u.id, u.full_name, u.email, u.role, ua.logged_in_at, ua.logged_out_at
      ORDER BY ua.logged_out_at DESC
    `, [today]);

    res.json({ employees: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logged out employees' });
  }
});

module.exports = router;
