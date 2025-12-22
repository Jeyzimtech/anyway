import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { getSalesAnalyticsTrends, getSalesAnalyticsYoY, getSalesAnalyticsMoM, getCategoryInsights, getProductAnalytics, getProfitabilityAnalytics, getInventoryAnalytics, getExpenseAnalytics } from '../lib/api';

export default function SalesAnalysis() {
  const [timeRange, setTimeRange] = useState('monthly');
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [yoyComparison, setYoyComparison] = useState([]);
  const [momGrowth, setMomGrowth] = useState([]);
  const [categoryInsights, setCategoryInsights] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const [reorderRecommendations, setReorderRecommendations] = useState([]);
  const [profitByProduct, setProfitByProduct] = useState([]);
  const [profitByCategory, setProfitByCategory] = useState([]);
  const [paretoData, setParetoData] = useState([]);
  const [stockTurnover, setStockTurnover] = useState([]);
  const [abcClassification, setAbcClassification] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [trendsRes, yoyRes, momRes, categoryRes, productRes, profitRes, inventoryRes, expenseRes] = await Promise.all([
        getSalesAnalyticsTrends(timeRange),
        getSalesAnalyticsYoY(timeRange),
        getSalesAnalyticsMoM(timeRange),
        getCategoryInsights(timeRange),
        getProductAnalytics(timeRange),
        getProfitabilityAnalytics(timeRange),
        getInventoryAnalytics(timeRange),
        getExpenseAnalytics(timeRange)
      ]);

      setMonthlySalesData(trendsRes.trends || []);
      setYoyComparison(yoyRes.yoyData || []);
      setMomGrowth(momRes.momData || []);
      setCategoryInsights(categoryRes.categoryInsights || []);
      setBestSellingProducts(productRes.bestSellingProducts || []);
      setDeadStock(productRes.deadStock || []);
      setReorderRecommendations(productRes.reorderRecommendations || []);
      setProfitByProduct(profitRes.profitByProduct || []);
      setProfitByCategory(profitRes.profitByCategory || []);
      setParetoData(profitRes.paretoData || []);
      setStockTurnover(inventoryRes.stockTurnover || []);
      setAbcClassification(inventoryRes.abcClassification || []);
      setExpenseData(expenseRes.expenseData || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Use empty arrays on error
      setMonthlySalesData([]);
      setYoyComparison([]);
      setMomGrowth([]);
      setCategoryInsights([]);
      setBestSellingProducts([]);
      setDeadStock([]);
      setReorderRecommendations([]);
      setProfitByProduct([]);
      setProfitByCategory([]);
      setParetoData([]);
      setStockTurnover([]);
      setAbcClassification([]);
      setExpenseData([]);
    } finally {
      setLoading(false);
    }
  };

  return (


    <>
<div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sales Analysis</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Deep reporting for decision making</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
        )}

        {!loading && (
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="trends">Sales Trends</TabsTrigger>
            <TabsTrigger value="category">Category Insights</TabsTrigger>
            <TabsTrigger value="products">Product Analytics</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          {/* A. Sales Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Cost Trend</CardTitle>
                  <CardDescription>Monthly comparison of revenue and costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="sales" fill="#3b82f6" name="Revenue ($)" />
                      <Bar dataKey="cost" fill="#ef4444" name="Cost ($)" />
                      <Line type="monotone" dataKey="profit" stroke="#22c55e" name="Profit ($)" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Year-over-Year Growth</CardTitle>
                  <CardDescription>Annual revenue comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={yoyComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                      <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#22c55e" name="Growth (%)" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Month-over-Month Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={momGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Growth']} />
                    <Bar dataKey="growth" name="MoM Growth (%)">
                      {momGrowth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.growth >= 0 ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* B. Category Deep Insights Tab */}
          <TabsContent value="category" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryInsights.map((cat) => (
                <Card key={cat.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cat.name}</CardTitle>
                      {cat.fastMover && <Badge variant="default">Fast Mover</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sales Volume</span>
                        <span className="font-medium">{cat.volume.toLocaleString()} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit Margin</span>
                        <span className="font-medium">{cat.margin}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Trend</span>
                        <div className="flex items-center gap-1">
                          {cat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {cat.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {cat.trend === "stable" && <BarChart3 className="h-4 w-4 text-gray-600" />}
                          <span className={cat.trend === "up" ? "text-green-600" : cat.trend === "down" ? "text-red-600" : ""}>
                            {cat.trend.charAt(0).toUpperCase() + cat.trend.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Category Sales Volume Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryInsights}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#3b82f6" name="Volume" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* C. Product Analytics Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Best Selling Products This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bestSellingProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sold} sold • {product.margin}% margin</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-600">${product.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Dead Stock (Not moved in 90+ days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deadStock.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Last sold: {item.lastSold}</p>
                        </div>
                        <Badge variant="destructive">{item.quantity} units</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Reorder Point Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Product</th>
                        <th className="text-center py-3 px-4">Current Stock</th>
                        <th className="text-center py-3 px-4">Reorder Point</th>
                        <th className="text-center py-3 px-4">Recommended Order</th>
                        <th className="text-center py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reorderRecommendations.map((item) => (
                        <tr key={item.product} className="border-b">
                          <td className="py-3 px-4 font-medium">{item.product}</td>
                          <td className="text-center py-3 px-4">{item.current}</td>
                          <td className="text-center py-3 px-4">{item.reorderPoint}</td>
                          <td className="text-center py-3 px-4">{item.recommended}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant={item.current < item.reorderPoint ? "destructive" : "secondary"}>
                              {item.current < item.reorderPoint ? "Reorder Now" : "OK"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* E. Profitability Tab */}
          <TabsContent value="profitability" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gross vs Net Profit by Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profitByProduct}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="grossProfit" fill="#3b82f6" name="Gross Profit" />
                      <Bar dataKey="netProfit" fill="#22c55e" name="Net Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Contribution by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={profitByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${entry.contribution}%`}
                        outerRadius={100}
                        dataKey="contribution"
                      >
                        {profitByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Contribution']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pareto Analysis (80/20 Rule)</CardTitle>
                <CardDescription>20% of products generate 80% of profit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={paretoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="profit" fill="#3b82f6" name="Profit ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2} name="Cumulative (%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* F. Inventory Analytics Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock Turnover Rate by Category</CardTitle>
                <CardDescription>How fast items sell - essential for oils</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stockTurnover}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="turnover" fill="#3b82f6" name="Turnover Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ABC Inventory Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {abcClassification.map((item) => (
                    <div key={item.class} className={`p-4 rounded-lg border ${
                      item.class === 'A' ? 'bg-red-50 border-red-300' :
                      item.class === 'B' ? 'bg-yellow-50 border-yellow-300' :
                      'bg-gray-50 border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={item.class === 'A' ? 'destructive' : item.class === 'B' ? 'secondary' : 'outline'} className="text-lg px-3 py-1">
                            Class {item.class}
                          </Badge>
                          <span className="font-medium">{item.value} of inventory value</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} items</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.items}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* H. Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={expenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                    <Legend />
                    <Area type="monotone" dataKey="supplier" stackId="1" stroke="#8884d8" fill="#8884d8" name="Supplier Costs" />
                    <Area type="monotone" dataKey="overhead" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Overhead" />
                    <Area type="monotone" dataKey="logistics" stackId="1" stroke="#ffc658" fill="#ffc658" name="Logistics" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </>
  );
}
