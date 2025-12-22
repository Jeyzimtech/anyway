const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Helper function to generate unique 6-digit alphanumeric reset code
function generateResetCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all users with their online status and approval status
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        id,
        email,
        full_name,
        role,
        approval_status,
        is_online,
        created_at,
        last_login,
        last_logout
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user management statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE approval_status = "approved"');
    const [pendingApprovals] = await pool.query('SELECT COUNT(*) as count FROM users WHERE approval_status = "pending"');
    const [activeNow] = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_online = TRUE');
    const [activeAdmins] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "admin" AND approval_status = "approved"');
    const [pendingResets] = await pool.query('SELECT COUNT(*) as count FROM password_resets WHERE is_used = FALSE AND expires_at > NOW()');

    res.json({
      totalUsers: totalUsers[0].count,
      pendingApprovals: pendingApprovals[0].count,
      activeNow: activeNow[0].count,
      activeAdmins: activeAdmins[0].count,
      pendingResets: pendingResets[0].count
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get pending user approvals (users waiting to be approved)
router.get('/pending-approvals', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        id,
        email,
        full_name,
        role as requested_role,
        approval_status as status,
        created_at
      FROM users
      WHERE approval_status = 'pending'
      ORDER BY created_at DESC
    `);
    
    res.json({ approvals: users });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// Approve user
router.put('/approve/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    await pool.query(
      'UPDATE users SET approval_status = ? WHERE id = ?',
      ['approved', userId]
    );
    
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user
router.put('/reject/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    await pool.query(
      'UPDATE users SET approval_status = ? WHERE id = ?',
      ['rejected', userId]
    );
    
    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Update user (role, full_name) - remove edit functionality as requested
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { full_name, role } = req.body;
  
  try {
    await pool.query(
      'UPDATE users SET full_name = ?, role = ? WHERE id = ?',
      [full_name, role, userId]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get all password reset requests
router.get('/password-resets', async (req, res) => {
  try {
    const [resets] = await pool.query(`
      SELECT 
        pr.id,
        pr.user_id,
        pr.email,
        pr.reset_code,
        pr.created_at,
        pr.expires_at,
        pr.is_used,
        u.role as requested_role
      FROM password_resets pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.is_used = FALSE AND pr.expires_at > NOW()
      ORDER BY pr.created_at DESC
    `);
    
    res.json({ resets });
  } catch (error) {
    console.error('Error fetching password resets:', error);
    res.status(500).json({ error: 'Failed to fetch password resets' });
  }
});

// Request password reset (create reset code)
router.post('/password-resets/request', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if user exists
    const [users] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    // Generate unique reset code
    let resetCode;
    let isUnique = false;
    
    while (!isUnique) {
      resetCode = generateResetCode();
      const [existing] = await pool.query(
        'SELECT id FROM password_resets WHERE reset_code = ? AND is_used = FALSE AND expires_at > NOW()',
        [resetCode]
      );
      if (existing.length === 0) {
        isUnique = true;
      }
    }
    
    // Create reset request (expires in 30 minutes)
    const resetId = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    await pool.query(
      `INSERT INTO password_resets (id, user_id, email, reset_code, expires_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [resetId, user.id, user.email, resetCode, expiresAt]
    );
    
    res.json({ 
      message: 'Password reset code generated',
      resetCode: resetCode,
      expiresAt: expiresAt
    });
  } catch (error) {
    console.error('Error creating password reset:', error);
    res.status(500).json({ error: 'Failed to create password reset request' });
  }
});

// Verify reset code
router.post('/password-resets/verify', async (req, res) => {
  const { resetCode } = req.body;
  
  try {
    const [resets] = await pool.query(
      `SELECT id, user_id, email, expires_at, is_used 
       FROM password_resets 
       WHERE reset_code = ?`,
      [resetCode]
    );
    
    if (resets.length === 0) {
      return res.status(404).json({ error: 'Invalid reset code' });
    }
    
    const reset = resets[0];
    
    if (reset.is_used) {
      return res.status(400).json({ error: 'Reset code has already been used' });
    }
    
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }
    
    res.json({ 
      valid: true,
      userId: reset.user_id,
      email: reset.email
    });
  } catch (error) {
    console.error('Error verifying reset code:', error);
    res.status(500).json({ error: 'Failed to verify reset code' });
  }
});

// Complete password reset
router.post('/password-resets/complete', async (req, res) => {
  const { resetCode, newPasswordHash } = req.body;
  
  try {
    // Verify code again
    const [resets] = await pool.query(
      `SELECT id, user_id, expires_at, is_used 
       FROM password_resets 
       WHERE reset_code = ?`,
      [resetCode]
    );
    
    if (resets.length === 0) {
      return res.status(404).json({ error: 'Invalid reset code' });
    }
    
    const reset = resets[0];
    
    if (reset.is_used) {
      return res.status(400).json({ error: 'Reset code has already been used' });
    }
    
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired' });
    }
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, reset.user_id]
    );
    
    // Mark reset as used
    await pool.query(
      'UPDATE password_resets SET is_used = TRUE WHERE id = ?',
      [reset.id]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error completing password reset:', error);
    res.status(500).json({ error: 'Failed to complete password reset' });
  }
});

// Get live activity logs
router.get('/activity', async (req, res) => {
  try {
    const [activities] = await pool.query(`
      SELECT 
        id,
        user_id,
        user_name,
        user_email,
        user_role,
        logged_in_at,
        logged_out_at,
        is_active
      FROM user_activity
      ORDER BY logged_in_at DESC
      LIMIT 50
    `);
    
    res.json({ activities });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Log user login
router.post('/activity/login', async (req, res) => {
  const { userId, userName, userEmail, userRole } = req.body;
  
  try {
    const activityId = uuidv4();
    
    // Create activity log
    await pool.query(
      `INSERT INTO user_activity (id, user_id, user_name, user_email, user_role, is_active, logged_in_at) 
       VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
      [activityId, userId, userName, userEmail, userRole]
    );
    
    // Update user online status
    await pool.query(
      'UPDATE users SET is_online = TRUE, last_login = NOW() WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'Login activity logged', activityId });
  } catch (error) {
    console.error('Error logging login:', error);
    res.status(500).json({ error: 'Failed to log login activity' });
  }
});

// Log user logout
router.post('/activity/logout', async (req, res) => {
  const { userId } = req.body;
  
  try {
    // Update most recent active session
    await pool.query(
      `UPDATE user_activity 
       SET logged_out_at = NOW(), is_active = FALSE 
       WHERE user_id = ? AND is_active = TRUE
       ORDER BY logged_in_at DESC
       LIMIT 1`,
      [userId]
    );
    
    // Update user online status
    await pool.query(
      'UPDATE users SET is_online = FALSE, last_logout = NOW() WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'Logout activity logged' });
  } catch (error) {
    console.error('Error logging logout:', error);
    res.status(500).json({ error: 'Failed to log logout activity' });
  }
});

// Change password for logged-in user
router.post('/change-password', async (req, res) => {
  const { userId, newPassword } = req.body;
  
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  // Validate password requirements
  const hasCapital = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const hasMinLength = newPassword.length >= 6;

  if (!hasCapital || !hasNumber || !hasSpecial || !hasMinLength) {
    return res.status(400).json({ 
      error: 'Password must contain at least one capital letter, one number, one special character, and be at least 6 characters long' 
    });
  }

  try {
    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hash, userId]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
