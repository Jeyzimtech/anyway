import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'components/ui/tabs';
import { DollarSign, ShoppingCart, TrendingUp, Package, Users, ArrowUpRight, ArrowDownRight, PieChart as PieIcon, BarChart3, LineChart as LineIcon, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { listProducts, getActiveEmployees, getLoggedOutEmployees, getSettings, getSalesAnalyticsTrends, getCategoryInsights, listOrders } from '../lib/api';

const COLORS = {
  primaryDataGreen: '#38A169',
  primaryDataBlue: '#4299E1',
  primaryDataRed: '#E53E3E',
  secondaryNeutral: '#F7FAFC',
  textDark: '#2D3748',
  textSubtle: '#718096',
  backgroundWhite: '#FFFFFF',
  borderGray: '#E2E8F0',
  chartColors: ['#9F7AEA', '#68D391', '#F6AD55', '#F687B3', '#4299E1', '#38B2AC'],
};

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [loggedOutEmployees, setLoggedOutEmployees] = useState<any[]>([]);
  const [employeeTab, setEmployeeTab] = useState<'active' | 'loggedout'>('active');
  const [settings, setSettings] = useState<any>({ lowStockThreshold: 20, criticalStockThreshold: 5, currency: 'USD', storeName: 'Store' });
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    profitMargin: 0,
    dailyProfit: [] as any[],
    cashflow: [] as any[],
    categoryDistribution: [] as any[],
    topStock: [] as any[],
    customersServed: 0,
  });

  useEffect(() => {
    fetchSettings();
    fetchDashboardData();
    fetchEmployeeActivity();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchEmployeeActivity = async () => {
    try {
      const [activeRes, loggedRes] = await Promise.all([
        getActiveEmployees(),
        getLoggedOutEmployees(),
      ]);
      setActiveEmployees(activeRes.employees || []);
      setLoggedOutEmployees(loggedRes.employees || []);
    } catch (error) {
      console.error('Error fetching employee activity:', error);
      setActiveEmployees([]);
      setLoggedOutEmployees([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch products from API
      const response = await listProducts({ page: 1, pageSize: 100, q: '' });
      const productList = response.products || response.items || response || [];
      const productsArray = Array.isArray(productList) ? productList : [];
      setProducts(productsArray);

      // Fetch real order data
      const { orders } = await listOrders({});
      const completedOrders = orders.filter(o => o.status === 'completed');
      
      // Calculate actual revenue and cost from completed orders
      let totalRevenue = 0;
      let totalCost = 0;
      let categoryMap: { [key: string]: number } = {};
      let customersServed = new Set();
      
      completedOrders.forEach(order => {
        totalRevenue += Number(order.total) || 0;
        if (order.customer_name) customersServed.add(order.customer_name);
        
        // Calculate cost from order items
        (order.items || []).forEach((item: any) => {
          const product = productsArray.find(p => p.id === item.product_id);
          const costPrice = product?.cost_price || 0;
          totalCost += Number(costPrice) * item.quantity;
          
          const category = product?.category || 'Other';
          categoryMap[category] = (categoryMap[category] || 0) + item.quantity;
        });
      });

      const grossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

      // Generate REAL Daily Sales/Profit for last 7 days
      const dailyProfit = [];
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Calculate actual profit for this day
        const dayOrders = completedOrders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= date && orderDate < nextDate;
        });
        
        let dayRevenue = 0;
        let dayCost = 0;
        dayOrders.forEach(order => {
          dayRevenue += Number(order.total) || 0;
          (order.items || []).forEach((item: any) => {
            const product = productsArray.find(p => p.id === item.product_id);
            const costPrice = product?.cost_price || 0;
            dayCost += Number(costPrice) * item.quantity;
          });
        });
        
        dailyProfit.push({ date: dateStr, profit: Math.floor(dayRevenue - dayCost) });
      }

      // Monthly Cashflow for last 6 months from real orders
      const cashflow = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const monthStart = new Date(year, date.getMonth(), 1);
        const monthEnd = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);
        
        const monthOrders = completedOrders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        
        let monthRevenue = 0;
        let monthCost = 0;
        monthOrders.forEach(order => {
          monthRevenue += Number(order.total) || 0;
          (order.items || []).forEach((item: any) => {
            const product = productsArray.find(p => p.id === item.product_id);
            const costPrice = product?.cost_price || 0;
            monthCost += Number(costPrice) * item.quantity;
          });
        });
        
        cashflow.push({ month, inflow: Math.floor(monthRevenue), outflow: Math.floor(monthCost) });
      }

      // Category Distribution from actual sales
      const categoryDistribution = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Top 10 Most Stocked Items (from inventory)
      const sortedByQty = [...productsArray]
        .map(p => ({
          ...p,
          quantity: Number(p.quantity) || 0,
        }))
        .sort((a, b) => b.quantity - a.quantity);
      
      const topStock = sortedByQty.slice(0, 10).map(p => ({
        item: p.name,
        category: p.category || 'Other',
        units: p.quantity,
      }));

      setDashboardData({
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin: Number(profitMargin),
        dailyProfit,
        cashflow,
        categoryDistribution,
        topStock,
        customersServed: customersServed.size,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const { totalRevenue, totalCost, grossProfit, profitMargin, dailyProfit, cashflow, categoryDistribution, topStock, customersServed } = dashboardData;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Top Level Heading */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: COLORS.textDark }}>Sales Overview</h1>
          <p className="text-xs sm:text-sm" style={{ color: COLORS.textSubtle }}>Clean and data-focused snapshot</p>
        </div>

        {/* KPI Cards Row (Revenue / Profit / COGS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card style={{ backgroundColor: COLORS.backgroundWhite }}>
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm" style={{ color: COLORS.textSubtle }}>Gross Revenue</CardTitle>
              <div className="rounded-md p-4" style={{ backgroundColor: COLORS.primaryDataGreen }}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-white">${totalRevenue.toFixed(2)}</span>
                  <DollarSign className="h-5 w-5 text-white opacity-80" />
                </div>
                <p className="text-xs mt-1 text-white/80">From completed sales</p>
              </div>
            </CardHeader>
          </Card>

          <Card style={{ backgroundColor: COLORS.backgroundWhite }}>
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm" style={{ color: COLORS.textSubtle }}>Gross Profit</CardTitle>
              <div className="rounded-md p-4" style={{ backgroundColor: COLORS.primaryDataBlue }}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-white">${grossProfit.toFixed(2)}</span>
                  <TrendingUp className="h-5 w-5 text-white opacity-80" />
                </div>
                <p className="text-xs mt-1 text-white/80">{profitMargin}% margin</p>
              </div>
            </CardHeader>
          </Card>

          <Card style={{ backgroundColor: COLORS.backgroundWhite }}>
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm" style={{ color: COLORS.textSubtle }}>Cost of Goods Sold</CardTitle>
              <div className="rounded-md p-4" style={{ backgroundColor: COLORS.primaryDataRed }}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-white">${totalCost.toFixed(2)}</span>
                  <Package className="h-5 w-5 text-white opacity-80" />
                </div>
                <p className="text-xs mt-1 text-white/80">{totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(0) : 0}% of revenue</p>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily Profit Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: COLORS.textDark }}>
                <LineIcon className="h-5 w-5" /> Daily Profit
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: COLORS.textSubtle }}>Last 7 days (actual sales)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dashboardData.dailyProfit}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="profit" stroke={COLORS.primaryDataGreen} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Cashflow Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: COLORS.textDark }}>
                <BarChart3 className="h-5 w-5" /> Monthly Cashflow Snapshot
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: COLORS.textSubtle }}>Last 6 months (actual data)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashboardData.cashflow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inflow" name="Inflow" fill={COLORS.primaryDataBlue} radius={[4,4,0,0]} />
                  <Bar dataKey="outflow" name="Outflow" fill={COLORS.primaryDataRed} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: COLORS.textDark }}>
                <PieIcon className="h-5 w-5" /> Category Distribution
              </CardTitle>
              <CardDescription className="text-xs" style={{ color: COLORS.textSubtle }}>Share of sales</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dashboardData.categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {dashboardData.categoryDistribution.map((_, idx) => (
                      <Cell key={idx} fill={COLORS.chartColors[idx % COLORS.chartColors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Stock Status and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Items List Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle style={{ color: COLORS.textDark }}>Top 10 Most Stocked Items</CardTitle>
              <CardDescription className="text-xs" style={{ color: COLORS.textSubtle }}>By units in stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.topStock && dashboardData.topStock.length > 0 ? (
                  dashboardData.topStock.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.secondaryNeutral }}>
                      <div>
                        <p className="font-medium" style={{ color: COLORS.textDark }}>{row.item}</p>
                        <p className="text-xs" style={{ color: COLORS.textSubtle }}>{row.category}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: COLORS.backgroundWhite, color: COLORS.textDark }}>
                        {row.units} units
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center" style={{ color: COLORS.textSubtle }}>No products in inventory</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock Alerts & Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: COLORS.textDark }}>
                <AlertTriangle className="h-5 w-5" style={{ color: '#F59E0B' }} />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.filter(p => p.quantity <= settings.criticalStockThreshold).length > 0 && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#991B1B' }}>
                      CRITICAL: {products.filter(p => p.quantity <= settings.criticalStockThreshold).length} items
                    </p>
                    {products.filter(p => p.quantity <= settings.criticalStockThreshold).slice(0, 2).map((p, idx) => (
                      <p key={idx} className="text-xs" style={{ color: '#7F1D1D' }}>
                        • {p.name} ({p.quantity} left)
                      </p>
                    ))}
                  </div>
                )}
                {products.filter(p => p.quantity > settings.criticalStockThreshold && p.quantity <= settings.lowStockThreshold).length > 0 && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#92400E' }}>
                      LOW STOCK: {products.filter(p => p.quantity > settings.criticalStockThreshold && p.quantity <= settings.lowStockThreshold).length} items
                    </p>
                    {products.filter(p => p.quantity > settings.criticalStockThreshold && p.quantity <= settings.lowStockThreshold).slice(0, 2).map((p, idx) => (
                      <p key={idx} className="text-xs" style={{ color: '#78350F' }}>
                        • {p.name} ({p.quantity} left)
                      </p>
                    ))}
                  </div>
                )}
                {products.filter(p => p.quantity <= settings.lowStockThreshold).length === 0 && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#D1FAE5', border: '1px solid #10B981' }}>
                    <p className="text-xs font-semibold" style={{ color: '#065F46' }}>
                      ✓ All stock levels healthy
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: COLORS.borderGray }}>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.secondaryNeutral }}>
                  <div>
                    <p className="text-sm" style={{ color: COLORS.textSubtle }}>Total Items Sold</p>
                    <p className="text-xs" style={{ color: COLORS.textSubtle }}>logged out users</p>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    {loggedOutEmployees.reduce((sum, emp) => sum + Number(emp.quantity_sold || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.secondaryNeutral }}>
                  <div>
                    <p className="text-sm" style={{ color: COLORS.textSubtle }}>Category Available</p>
                    <p className="text-xs" style={{ color: COLORS.textSubtle }}>in inventory</p>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
                    {new Set(products.map(p => p.category || 'Other')).size}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Details with tabs */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: COLORS.textDark }}>User Activity</CardTitle>
            <CardDescription className="text-xs" style={{ color: COLORS.textSubtle }}>Login/Logout times and items sold</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value="loggedout">
              <TabsContent value="loggedout">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.borderGray}` }}>
                        <th className="text-left p-2" style={{ color: COLORS.textDark }}>Username</th>
                        <th className="text-left p-2" style={{ color: COLORS.textDark }}>Date</th>
                        <th className="text-left p-2" style={{ color: COLORS.textDark }}>Login Time</th>
                        <th className="text-left p-2" style={{ color: COLORS.textDark }}>Logout Time</th>
                        <th className="text-right p-2" style={{ color: COLORS.textDark }}>Items Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loggedOutEmployees && loggedOutEmployees.length > 0 ? (
                        loggedOutEmployees.map((emp, idx) => {
                          const loggedInAgain = activeEmployees.some((a) => a.email === emp.email);
                          return (
                            <tr
                              key={idx}
                              style={{ borderBottom: `1px solid ${COLORS.borderGray}` }}
                            >
                              <td className="p-2" style={{ color: COLORS.textDark }}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.textSubtle }}></div>
                                  <span className="font-medium">{emp.username || 'Unknown User'}</span>
                                </div>
                                <div className="text-xs" style={{ color: COLORS.textSubtle }}>
                                  {emp.email}
                                  {loggedInAgain && (
                                    <span className="ml-2 inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[11px]">
                                      Logged in again
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2" style={{ color: COLORS.textSubtle }}>{emp.date}</td>
                              <td className="p-2" style={{ color: COLORS.textSubtle }}>{emp.login_time_formatted}</td>
                              <td className="p-2" style={{ color: COLORS.textDark, fontWeight: 600 }}>{emp.logout_time_formatted}</td>
                              <td className="p-2 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="inline-block px-2 py-1 rounded font-semibold text-xs" style={{ backgroundColor: COLORS.primaryDataBlue, color: 'white' }}>
                                    {emp.quantity_sold || 0} items
                                  </span>
                                  {emp.orders_count > 0 && (
                                    <span className="text-xs" style={{ color: COLORS.textSubtle }}>
                                      {emp.orders_count} {emp.orders_count === 1 ? 'order' : 'orders'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center" style={{ color: COLORS.textSubtle }}>
                            No logged out sessions today
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
}
