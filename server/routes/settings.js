const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings LIMIT 1');
    
    if (settings.length === 0) {
      // Return defaults if no settings exist
      return res.json({
        lowStockThreshold: 20,
        criticalStockThreshold: 5,
        storeName: 'Auto Parts Store',
        taxRate: 8,
        currency: 'USD',
        stockAlerts: true,
        salesReports: false
      });
    }
    
    res.json(settings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update stock thresholds
router.put('/stock-thresholds', async (req, res) => {
  try {
    const { lowStockThreshold, criticalStockThreshold } = req.body;
    
    // Check if settings exist
    const [existing] = await pool.query('SELECT id FROM settings LIMIT 1');
    
    if (existing.length === 0) {
      // Insert new settings
      await pool.query(
        'INSERT INTO settings (lowStockThreshold, criticalStockThreshold) VALUES (?, ?)',
        [lowStockThreshold, criticalStockThreshold]
      );
    } else {
      // Update existing settings
      await pool.query(
        'UPDATE settings SET lowStockThreshold = ?, criticalStockThreshold = ? WHERE id = ?',
        [lowStockThreshold, criticalStockThreshold, existing[0].id]
      );
    }
    
    res.json({ message: 'Stock thresholds updated successfully' });
  } catch (error) {
    console.error('Error updating stock thresholds:', error);
    res.status(500).json({ error: 'Failed to update stock thresholds' });
  }
});

// Update system settings
router.put('/system', async (req, res) => {
  try {
    const { storeName, taxRate, currency } = req.body;
    
    // Check if settings exist
    const [existing] = await pool.query('SELECT id FROM settings LIMIT 1');
    
    if (existing.length === 0) {
      // Insert new settings
      await pool.query(
        'INSERT INTO settings (storeName, taxRate, currency) VALUES (?, ?, ?)',
        [storeName, taxRate, currency]
      );
    } else {
      // Update existing settings
      await pool.query(
        'UPDATE settings SET storeName = ?, taxRate = ?, currency = ? WHERE id = ?',
        [storeName, taxRate, currency, existing[0].id]
      );
    }
    
    res.json({ message: 'System settings updated successfully' });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// Update notification preferences
router.put('/notifications', async (req, res) => {
  try {
    const { stockAlerts, salesReports } = req.body;
    
    // Check if settings exist
    const [existing] = await pool.query('SELECT id FROM settings LIMIT 1');
    
    if (existing.length === 0) {
      // Insert new settings
      await pool.query(
        'INSERT INTO settings (stockAlerts, salesReports) VALUES (?, ?)',
        [stockAlerts, salesReports]
      );
    } else {
      // Update existing settings
      await pool.query(
        'UPDATE settings SET stockAlerts = ?, salesReports = ? WHERE id = ?',
        [stockAlerts, salesReports, existing[0].id]
      );
    }
    
    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Daily sales report endpoint removed
module.exports = router;
