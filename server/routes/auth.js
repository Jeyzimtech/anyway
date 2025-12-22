const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, full_name, role = 'employee' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    console.log(`[REGISTER] Attempting registration for email: ${email}`);
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      console.log(`[REGISTER] Email already exists: ${email}`);
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    const id = require('crypto').randomUUID();
    await pool.query('INSERT INTO users (id, email, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [id, email, hash, full_name || null, role]);
    console.log(`[REGISTER] Success for: ${email}`);
    res.status(201).json({ id });
  } catch (e) {
    console.error('[REGISTER] Error:', e.message);
    res.status(500).json({ error: 'Registration failed: ' + e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    console.log(`[LOGIN] Attempting login for email: ${email}`);
    const [rows] = await pool.query('SELECT id, email, password_hash, role, full_name FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      console.log(`[LOGIN] User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.log(`[LOGIN] Invalid password for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    console.log(`[LOGIN] Success for: ${email}`);
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (e) {
    console.error('[LOGIN] Error:', e.message);
    res.status(500).json({ error: 'Login failed: ' + e.message });
  }
});

module.exports = router;
