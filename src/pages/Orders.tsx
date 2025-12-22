import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'components/ui/dialog';
import { Eye, Download, MoreVertical, ShoppingBag, Clock, CheckCircle, Package, CreditCard, Search, Trash2 } from 'lucide-react';
import { listOrders, updateOrder, deleteOrder } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadDiscounts, getActiveDiscount as getActiveDis, getDiscountedPrice, type Discount } from '../lib/discountUtils';

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const getActiveDiscount = (product: any): Discount | null => {
    return getActiveDis(product, discounts);
  };

  useEffect(() => {
    fetchOrders();
    setDiscounts(loadDiscounts());
  }, [location]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { orders: fetchedOrders } = await listOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrder(orderId, { status: newStatus });
      fetchOrders();
      alert('Order status updated successfully');
    } catch (error) {
      alert('Failed to update order status: ' + error.message);
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!window.confirm('Are you sure you want to delete this pending order? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteOrder(orderId);
      fetchOrders();
      alert('Order deleted successfully');
    } catch (error) {
      alert('Failed to delete order: ' + error.message);
    }
  }

  function viewOrderDetails(order) {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  }

  function processPayment(order) {
    // Store order in sessionStorage to access in Sales page
    sessionStorage.setItem('pendingOrder', JSON.stringify(order));
    navigate('/sales', { state: { order } });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filteredOrders = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  // Apply search filter on top of tab filter
  const searchFilteredOrders = filteredOrders.filter(order => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.payment_method?.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query) ||
      order.total.toString().includes(query)
    );
  });

  return (


    <>
<div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">View and manage all orders</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold">{orders.length}</p>
                </div>
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold">{orders.filter(o => o.status === 'completed').length}</p>
                </div>
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({orders.filter(o => o.status === 'completed').length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</TabsTrigger>
          </TabsList>

          {['all', 'completed', 'pending'].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by Order ID, Customer, Payment Method, Status, or Amount..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Order List
                    {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
                    {searchQuery && (
                      <span className="text-sm text-muted-foreground">
                        ({searchFilteredOrders.length} result{searchFilteredOrders.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                ) : searchFilteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    {searchQuery ? (
                      <>
                        <p className="text-muted-foreground">No orders found matching "{searchQuery}"</p>
                        <Button 
                          variant="link" 
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">No orders found</p>
                        <p className="text-sm text-muted-foreground">Create a sale to see orders here</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                          <th className="text-left py-3 px-4 font-semibold">Customer</th>
                          <th className="text-left py-3 px-4 font-semibold">Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Items</th>
                          <th className="text-left py-3 px-4 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold">Payment</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchFilteredOrders.map(order => (
                          <tr key={order.id} className="border-b hover:bg-accent/50">
                            <td className="py-3 px-4 font-mono text-sm">{order.id}</td>
                            <td className="py-3 px-4">{order.customer_name}</td>
                            <td className="py-3 px-4 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items</Badge>
                            </td>
                            <td className="py-3 px-4 font-semibold">${parseFloat(order.total).toFixed(2)}</td>
                            <td className="py-3 px-4 capitalize text-sm">{order.payment_method || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusColor(order.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(order.status)}
                                  {order.status}
                                </span>
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => viewOrderDetails(order)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {order.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => processPayment(order)}
                                      title="Process Payment"
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteOrder(order.id)}
                                      title="Delete Order"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-semibold">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="capitalize">{selectedOrder.payment_method || 'N/A'}</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-accent/50 p-2 rounded">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Order Items Summary</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Card className="p-4">
                      <div className="flex flex-col items-center">
                        <Package className="w-8 h-8 text-blue-600 mb-2" />
                        <p className="text-sm text-muted-foreground">Total Categories</p>
                        <p className="text-2xl font-bold">{selectedOrder.items?.length || 0}</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex flex-col items-center">
                        <ShoppingBag className="w-8 h-8 text-green-600 mb-2" />
                        <p className="text-sm text-muted-foreground">Total Quantity</p>
                        <p className="text-2xl font-bold">
                          {selectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                        </p>
                      </div>
                    </Card>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-accent/50">
                        <tr>
                          <th className="text-left py-2 px-3 text-sm font-semibold">Product Name</th>
                          <th className="text-right py-2 px-3 text-sm font-semibold">Price</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold">Quantity</th>
                          <th className="text-right py-2 px-3 text-sm font-semibold">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="py-2 px-3 text-sm">{item.product_name}</td>
                            <td className="py-2 px-3 text-sm text-right">${parseFloat(item.price).toFixed(2)}</td>
                            <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                            <td className="py-2 px-3 text-sm text-right font-medium">${parseFloat(item.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">${parseFloat(selectedOrder.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
