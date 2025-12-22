const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Helper function to get date range based on timeRange parameter
function getDateRange(timeRange) {
  const ranges = {
    'daily': 'DATE_SUB(NOW(), INTERVAL 1 DAY)',
    'weekly': 'DATE_SUB(NOW(), INTERVAL 7 DAY)',
    'monthly': 'DATE_SUB(NOW(), INTERVAL 30 DAY)',
    'yearly': 'DATE_SUB(NOW(), INTERVAL 365 DAY)'
  };
  return ranges[timeRange] || ranges['monthly'];
}

// Helper function to get date format based on timeRange
function getDateFormat(timeRange) {
  const formats = {
    'daily': '%H:00', // Hour format
    'weekly': '%a', // Day of week
    'monthly': '%b %Y', // Month Year
    'yearly': '%Y' // Year only
  };
  return formats[timeRange] || formats['monthly'];
}

// Helper function to get grouping based on timeRange
function getGrouping(timeRange) {
  const groupings = {
    'daily': 'YEAR(o.created_at), MONTH(o.created_at), DAY(o.created_at), HOUR(o.created_at)',
    'weekly': 'YEAR(o.created_at), WEEK(o.created_at)',
    'monthly': 'YEAR(o.created_at), MONTH(o.created_at)',
    'yearly': 'YEAR(o.created_at)'
  };
  return groupings[timeRange] || groupings['monthly'];
}

// Helper function to get ordering based on timeRange (same as grouping for SQL compliance)
function getOrdering(timeRange) {
  return getGrouping(timeRange); // ORDER BY same fields as GROUP BY
}

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM orders ORDER BY created_at DESC';
    let params = [];
    
    if (status) {
      query = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC';
      params = [status];
    }
    
    const [orders] = await pool.query(query, params);
    
    // Get order items for each order
    for (let order of orders) {
      const [items] = await pool.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }
    
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const { items, customer_name, payment_method, status = 'pending', notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const tax = subtotal * 0; // 0% tax for now
    const total = subtotal + tax;
    
    // Create order
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [orderResult] = await connection.query(
      `INSERT INTO orders (id, customer_name, subtotal, tax, total, status, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [orderId, customer_name || 'Walk-in Customer', subtotal, tax, total, status, payment_method || 'cash', notes || '']
    );
    
    // Create order items
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, item.quantity, parseFloat(item.price), parseFloat(item.price) * item.quantity]
      );
      
      // Update product quantity if order is completed
      if (status === 'completed') {
        await connection.query(
          'UPDATE products SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.id]
        );
      }
    }
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      orderId,
      message: 'Order created successfully' 
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    console.error('Error creating order:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Get order details
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[0];
    
    // If changing from pending to completed, update product quantities
    if (order.status === 'pending' && status === 'completed') {
      const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        await connection.query(
          'UPDATE products SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }
    
    // Update order status
    await connection.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  } finally {
    connection.release();
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Delete order items first
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Delete order
    await connection.query('DELETE FROM orders WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  } finally {
    connection.release();
  }
});

// Get revenue and cost trends with time range support
router.get('/analytics/trends', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    const dateFormat = getDateFormat(timeRange);
    const grouping = getGrouping(timeRange);
    const ordering = getOrdering(timeRange);
    
    const [orders] = await pool.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '${dateFormat}') AS label,
        SUM(o.total) AS revenue
      FROM orders o
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY ${grouping}, DATE_FORMAT(o.created_at, '${dateFormat}')
      ORDER BY ${ordering}
    `);

    // Get cost data from products
    const [products] = await pool.query(`
      SELECT 
        p.cost_price,
        p.price,
        p.quantity
      FROM products p
    `);

    // Calculate total COGS
    let totalCost = 0;
    products.forEach(p => {
      totalCost += (p.cost_price || 0) * (p.quantity || 0);
    });

    // Estimate monthly costs proportionally
    const monthlyData = orders.map(order => ({
      name: order.label,
      sales: parseFloat(order.revenue) || 0,
      cost: Math.floor((parseFloat(order.revenue) || 0) * 0.4), // Estimate 40% as COGS
      profit: Math.floor((parseFloat(order.revenue) || 0) * 0.6)
    }));

    res.json({ trends: monthlyData });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get year-over-year comparison
router.get('/analytics/yoy', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    
    const [results] = await pool.query(`
      SELECT 
        YEAR(o.created_at) as year,
        SUM(o.total) as revenue
      FROM orders o
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY YEAR(o.created_at)
      ORDER BY year
    `);

    const yoyData = results.map((row, idx) => ({
      year: row.year.toString(),
      revenue: parseFloat(row.revenue) || 0,
      growth: idx === 0 ? 0 : Math.round(((parseFloat(row.revenue) - parseFloat(results[idx-1].revenue)) / parseFloat(results[idx-1].revenue)) * 100 * 10) / 10
    }));

    res.json({ yoyData });
  } catch (error) {
    console.error('Error fetching YoY data:', error);
    res.status(500).json({ error: 'Failed to fetch YoY data' });
  }
});

// Get month-over-month growth
router.get('/analytics/mom', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    const dateFormat = getDateFormat(timeRange);
    const grouping = getGrouping(timeRange);
    const ordering = getOrdering(timeRange);
    
    const [results] = await pool.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '${dateFormat}') AS month,
        SUM(o.total) AS revenue
      FROM orders o
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY ${grouping}, DATE_FORMAT(o.created_at, '${dateFormat}')
      ORDER BY ${ordering}
    `);

    const momData = results.map((row, idx) => ({
      month: row.month,
      growth: idx === 0 ? 0 : Math.round(((parseFloat(row.revenue) - parseFloat(results[idx-1].revenue)) / parseFloat(results[idx-1].revenue)) * 100 * 10) / 10
    }));

    res.json({ momData });
  } catch (error) {
    console.error('Error fetching MoM data:', error);
    res.status(500).json({ error: 'Failed to fetch MoM data' });
  }
});

// Get category insights with historical trend analysis
router.get('/analytics/categories', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    
    // Get current period category data
    const [currentData] = await pool.query(`
      SELECT 
        p.category AS name,
        SUM(oi.quantity) AS volume,
        SUM(oi.subtotal) AS revenue,
        SUM(oi.quantity * p.cost_price) AS cost,
        COUNT(DISTINCT o.id) AS order_count
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' 
        AND o.created_at >= ${dateRange}
      GROUP BY p.category
      ORDER BY volume DESC
    `);

    // Get previous period data for trend comparison
    // Calculate intervals based on timeRange
    const daysMap = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
    const days = daysMap[timeRange] || 30;
    
    const [previousData] = await pool.query(`
      SELECT 
        p.category AS name,
        SUM(oi.quantity) AS volume
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' 
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL ${days * 2} DAY)
        AND o.created_at < DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY p.category
    `);

    // Create a map for previous period volumes
    const prevMap = {};
    previousData.forEach(item => {
      prevMap[item.name] = parseInt(item.volume) || 0;
    });

    // Calculate average volume for fast mover identification
    const totalVolume = currentData.reduce((sum, c) => sum + (parseInt(c.volume) || 0), 0);
    const avgVolume = currentData.length > 0 ? totalVolume / currentData.length : 0;

    const categoryInsights = currentData.map(cat => {
      const revenue = parseFloat(cat.revenue) || 0;
      const cost = parseFloat(cat.cost) || 0;
      const profit = revenue - cost;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
      const volume = parseInt(cat.volume) || 0;
      const orderCount = parseInt(cat.order_count) || 0;
      
      // Determine if it's a fast mover (above average volume)
      const fastMover = volume > avgVolume;
      
      // Calculate trend based on volume change vs previous period
      const prevVolume = prevMap[cat.name] || 0;
      let trend = "stable";
      if (prevVolume > 0) {
        const change = ((volume - prevVolume) / prevVolume) * 100;
        if (change > 10) trend = "up";
        else if (change < -10) trend = "down";
      } else if (volume > 0) {
        trend = "up"; // New category with sales
      }

      return {
        name: cat.name,
        volume,
        margin,
        trend,
        fastMover,
        revenue,
        profit,
        orderCount
      };
    });

    res.json({ categoryInsights });
  } catch (error) {
    console.error('Error fetching category insights:', error);
    res.status(500).json({ error: 'Failed to fetch category insights' });
  }
});

// Get product analytics - best sellers, dead stock, reorder recommendations
router.get('/analytics/products', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    
    // Get best selling products
    const [bestSellers] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.cost_price,
        SUM(oi.quantity) AS sold,
        SUM(oi.subtotal) AS revenue,
        ROUND(((p.price - p.cost_price) / p.price) * 100) AS margin
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY p.id, p.name, p.price, p.cost_price
      ORDER BY sold DESC
      LIMIT 5
    `);

    // Get dead stock (products with no sales in last 90 days but have inventory)
    const [deadStockData] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.quantity,
        COALESCE(MAX(o.created_at), p.created_at) AS last_sold_date,
        DATEDIFF(NOW(), COALESCE(MAX(o.created_at), p.created_at)) AS days_since_sold
      FROM products p
      LEFT JOIN order_items oi ON CAST(p.id AS CHAR) = CAST(oi.product_id AS CHAR)
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      WHERE p.quantity > 0
      GROUP BY p.id, p.name, p.quantity, p.created_at
      HAVING days_since_sold >= 90
      ORDER BY days_since_sold DESC
      LIMIT 5
    `);

    const deadStock = deadStockData.map(item => ({
      name: item.name,
      quantity: item.quantity,
      lastSold: `${item.days_since_sold} days ago`
    }));

    // Get reorder recommendations (low stock products with high sales velocity)
    const [reorderData] = await pool.query(`
      SELECT 
        p.id,
        p.name AS product,
        p.quantity AS current,
        COALESCE(SUM(oi.quantity), 0) AS sales_total,
        ROUND(COALESCE(SUM(oi.quantity), 0) / 30 * 14) AS recommended
      FROM products p
      LEFT JOIN order_items oi ON CAST(p.id AS CHAR) = CAST(oi.product_id AS CHAR)
      LEFT JOIN orders o ON oi.order_id = o.id 
        AND o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY p.id, p.name, p.quantity
      HAVING sales_total > 0
      ORDER BY (sales_total / GREATEST(p.quantity, 1)) DESC
      LIMIT 5
    `);

    // Calculate days based on timeRange
    const daysMap = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
    const days = daysMap[timeRange] || 30;

    const reorderRecommendations = reorderData.map(item => {
      const avgDailySales = item.sales_total / days;
      const reorderPoint = Math.ceil(avgDailySales * 7); // 1 week supply
      return {
        product: item.product,
        current: item.current,
        reorderPoint,
        recommended: Math.max(item.recommended, reorderPoint * 2)
      };
    });

    res.json({ 
      bestSellingProducts: bestSellers,
      deadStock,
      reorderRecommendations
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// Get profitability analysis - profit by product and category
router.get('/analytics/profitability', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    
    // Get profit by product
    const [profitByProductData] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.cost_price,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.subtotal) AS revenue,
        SUM(oi.quantity * p.cost_price) AS cost
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY p.id, p.name, p.price, p.cost_price
      ORDER BY (SUM(oi.subtotal) - SUM(oi.quantity * p.cost_price)) DESC
      LIMIT 10
    `);

    const profitByProduct = profitByProductData.map(item => {
      const revenue = parseFloat(item.revenue) || 0;
      const cost = parseFloat(item.cost) || 0;
      const grossProfit = revenue - cost;
      const netProfit = Math.round(grossProfit * 0.8); // Estimate 20% overhead
      
      return {
        name: item.name,
        revenue,
        cost,
        grossProfit,
        netProfit,
        units_sold: item.units_sold
      };
    });

    // Get profit by category
    const [profitByCategoryData] = await pool.query(`
      SELECT 
        p.category AS name,
        SUM(oi.subtotal) AS revenue,
        SUM(oi.quantity * p.cost_price) AS cost
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY p.category
      ORDER BY (SUM(oi.subtotal) - SUM(oi.quantity * p.cost_price)) DESC
    `);

    // Calculate total profit and contribution percentages
    const totalProfit = profitByCategoryData.reduce((sum, item) => {
      const revenue = parseFloat(item.revenue) || 0;
      const cost = parseFloat(item.cost) || 0;
      return sum + (revenue - cost);
    }, 0);

    const profitByCategory = profitByCategoryData.map(item => {
      const revenue = parseFloat(item.revenue) || 0;
      const cost = parseFloat(item.cost) || 0;
      const profit = revenue - cost;
      const contribution = totalProfit > 0 ? Math.round((profit / totalProfit) * 100) : 0;
      
      return {
        name: item.name,
        profit: Math.round(profit),
        contribution
      };
    });

    // Create Pareto chart data (80/20 rule - top products by profit)
    const paretoData = profitByProduct.map((item, idx) => ({
      name: item.name,
      profit: Math.round(item.grossProfit),
      cumulative: idx + 1 // Simplified cumulative for now
    }));

    res.json({ 
      profitByProduct,
      profitByCategory,
      paretoData,
      totalProfit: Math.round(totalProfit)
    });
  } catch (error) {
    console.error('Error fetching profitability data:', error);
    res.status(500).json({ error: 'Failed to fetch profitability data' });
  }
});

// Get inventory analytics - stock turnover and ABC classification
router.get('/analytics/inventory', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = timeRange === 'yearly' ? 'DATE_SUB(NOW(), INTERVAL 365 DAY)' : getDateRange(timeRange);
    
    // Get stock turnover rate by category (sales volume / average inventory)
    const [turnoverData] = await pool.query(`
      SELECT 
        p.category,
        SUM(oi.quantity) AS total_sold,
        AVG(p.quantity) AS avg_inventory,
        ROUND(SUM(oi.quantity) / GREATEST(AVG(p.quantity), 1), 2) AS turnover,
        ROUND(365 / GREATEST(SUM(oi.quantity) / GREATEST(AVG(p.quantity), 1), 0.01), 0) AS days_in_stock
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY p.category
      ORDER BY turnover DESC
    `);

    const stockTurnover = turnoverData.map(item => ({
      category: item.category,
      turnover: parseFloat(item.turnover) || 0,
      days: parseInt(item.days_in_stock) || 0
    }));

    // Get ABC classification based on revenue contribution
    const abcDateRange = getDateRange(req.query.timeRange || 'monthly');
    const [abcData] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        SUM(oi.subtotal) AS revenue,
        COUNT(*) as order_count
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${abcDateRange}
      GROUP BY p.id, p.name, p.category
      ORDER BY revenue DESC
    `);

    // Calculate cumulative revenue percentage
    const totalRevenue = abcData.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0);
    let cumulativePercent = 0;
    
    const classifiedItems = {
      A: { items: [], value: 0, count: 0 },
      B: { items: [], value: 0, count: 0 },
      C: { items: [], value: 0, count: 0 }
    };

    abcData.forEach(item => {
      const revenue = parseFloat(item.revenue) || 0;
      const percent = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      cumulativePercent += percent;
      
      let classification = 'C';
      if (cumulativePercent <= 80) {
        classification = 'A';
      } else if (cumulativePercent <= 95) {
        classification = 'B';
      }
      
      classifiedItems[classification].items.push({
        name: item.name,
        category: item.category,
        revenue: Math.round(revenue)
      });
      classifiedItems[classification].count++;
      classifiedItems[classification].value += revenue;
    });

    const abcClassification = [
      {
        class: 'A',
        items: classifiedItems.A.items.slice(0, 5).map(i => i.name).join(', ') || 'High-value products',
        value: classifiedItems.A.count > 0 ? '80%' : '0%',
        count: classifiedItems.A.count
      },
      {
        class: 'B',
        items: classifiedItems.B.items.slice(0, 5).map(i => i.name).join(', ') || 'Medium-value products',
        value: classifiedItems.B.count > 0 ? '15%' : '0%',
        count: classifiedItems.B.count
      },
      {
        class: 'C',
        items: classifiedItems.C.items.slice(0, 5).map(i => i.name).join(', ') || 'Low-value products',
        value: classifiedItems.C.count > 0 ? '5%' : '0%',
        count: classifiedItems.C.count
      }
    ];

    res.json({ 
      stockTurnover,
      abcClassification
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory analytics' });
  }
});

// Get expense analytics - costs breakdown by time range
router.get('/analytics/expenses', async (req, res) => {
  try {
    const { timeRange = 'monthly' } = req.query;
    const dateRange = getDateRange(timeRange);
    const dateFormat = getDateFormat(timeRange);
    const grouping = getGrouping(timeRange);
    const ordering = getOrdering(timeRange);
    
    // Get expense data from order costs (supplier costs estimated from COGS)
    const [monthlyExpenses] = await pool.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '${dateFormat}') AS month,
        SUM(oi.quantity * p.cost_price) AS supplier_cost,
        ROUND(SUM(oi.subtotal) * 0.1, 2) AS overhead,
        ROUND(SUM(oi.quantity * p.cost_price) * 0.05, 2) AS logistics
      FROM order_items oi
      JOIN products p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR)
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
        AND o.created_at >= ${dateRange}
      GROUP BY ${grouping}, DATE_FORMAT(o.created_at, '${dateFormat}')
      ORDER BY ${ordering}
    `);

    const expenseData = monthlyExpenses.map(item => ({
      month: item.month,
      supplier: Math.round(parseFloat(item.supplier_cost) || 0),
      overhead: Math.round(parseFloat(item.overhead) || 0),
      logistics: Math.round(parseFloat(item.logistics) || 0)
    }));

    res.json({ expenseData });
  } catch (error) {
    console.error('Error fetching expense analytics:', error);
    res.status(500).json({ error: 'Failed to fetch expense analytics' });
  }
});

module.exports = router;
