const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// List profiles
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, full_name, role, approval_status FROM profiles');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

module.exports = router;
