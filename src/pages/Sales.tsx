import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Badge } from 'components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, CreditCard, Banknote, Clock, CheckCircle, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { Label } from 'components/ui/label';
import { RadioGroup, RadioGroupItem } from 'components/ui/radio-group';
import { Textarea } from 'components/ui/textarea';
import { listProducts, createOrder, updateOrder, getSettings } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadDiscounts, getActiveDiscount as getActiveDis, getDiscountedPrice, type Discount } from '../lib/discountUtils';

export default function Sales() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [settings, setSettings] = useState<any>({ lowStockThreshold: 20, criticalStockThreshold: 5 });
  
  // Cash payment state
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  
  // Card payment state
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [cardProcessing, setCardProcessing] = useState(false);
  const [cardStatus, setCardStatus] = useState<'processing' | 'approved' | 'declined' | null>(null);
  const [approvalCode, setApprovalCode] = useState('');

  const categoryIcons = {
    'Motor Spare Parts': '🔧',
    'Engine Oil': '🛢️',
    'Grease': '🧴',
    'Hydraulic Oil': '💧',
    'Transmission Oil': '⚙️',
    'Service Kits': '🧰',
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= settings.criticalStockThreshold) return { status: "Critical", variant: "destructive" as const };
    if (quantity <= settings.lowStockThreshold) return { status: "Low Stock", variant: "secondary" as const };
    return { status: "In Stock", variant: "default" as const };
  };

  // Wrapper to easily access getActiveDiscount with current discounts
  const getActiveDiscount = (product: any): Discount | null => {
    return getActiveDis(product, discounts);
  };

  useEffect(() => {
    fetchProducts();
    setDiscounts(loadDiscounts());
    fetchSettings();
    
    // Check for search query in URL
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  async function fetchSettings() {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  }

  // Prefill cart when arriving from pending order
  useEffect(() => {
    try {
      const stateOrder = (location as any)?.state?.order;
      const stored = sessionStorage.getItem('pendingOrder');
      const order = stateOrder || (stored ? JSON.parse(stored) : null);
      if (order && order.status === 'pending') {
        const prefilledCart = (order.items || []).map((item: any) => ({
          id: item.product_id || item.id,
          name: item.product_name || item.name,
          category: 'Pending Order',
          quantity: item.quantity,
          price: parseFloat(item.price)
        }));
        setCart(prefilledCart);
        setCustomerName(order.customer_name || 'Walk-in Customer');
        if (order.notes) setNotes(order.notes);
        setActiveOrder(order);
      }
    } catch (e) {
      console.error('Failed to prefill cart from pending order:', e);
    }
  }, [location]);

  async function fetchProducts() {
    try {
      const { items } = await listProducts({ page: 1, pageSize: 500 });
      setProducts(items);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  }

  const categories: Array<{ name: string; label: string; icon: string; count?: number }> = [
    { name: 'all', label: 'All Products', icon: '📦' },
    ...Object.entries(
      products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, count]) => ({
      name,
      label: name,
      icon: categoryIcons[name as keyof typeof categoryIcons] || '📦',
      count: count as number,
    })),
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.quantity > 0;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleAmountChange = (value: string) => {
    setAmountReceived(value);
    const amount = parseFloat(value) || 0;
    setChange(Math.max(0, amount - cartTotal));
  };

  const processCashPayment = async () => {
    const amount = parseFloat(amountReceived) || 0;
    if (amount < cartTotal) {
      alert('Insufficient amount');
      return;
    }

    setProcessingOrder(true);
    try {
      if (activeOrder) {
        // Completing an existing pending order
        await updateOrder(activeOrder.id, { status: 'completed', payment_method: 'cash' });
        alert(`Sale completed! Order: ${activeOrder.id}\nChange Due: $${(amount - cartTotal).toFixed(2)}`);
      } else {
        // New sale flow
        const formattedItems = cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }));

        const result = await createOrder({
          items: formattedItems,
          customer_name: customerName || 'Walk-in Customer',
          payment_method: 'cash',
          status: 'completed',
          notes: `Cash Payment - Received: $${amount.toFixed(2)}, Change: $${(amount - cartTotal).toFixed(2)}${notes ? ' - ' + notes : ''}`
        });
        alert(`Sale completed! Order: ${result.orderId}\nChange Due: $${(amount - cartTotal).toFixed(2)}`);
      }
      setCart([]);
      setShowCashDialog(false);
      setCustomerName('');
      setNotes('');
      setAmountReceived('');
      setChange(0);
      sessionStorage.removeItem('pendingOrder');
      setActiveOrder(null);
      
      fetchProducts();
      navigate('/orders');
    } catch (error: any) {
      alert('Failed to create order: ' + error.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  const processCardPayment = async () => {
    setCardProcessing(true);
    setCardStatus('processing');

    // Simulate card terminal processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate approval/decline (90% approval rate)
    const approved = Math.random() > 0.1;
    
    if (approved) {
      const code = 'AUTH' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setApprovalCode(code);
      setCardStatus('approved');
      
      try {
        if (activeOrder) {
          // Completing an existing pending order
          await updateOrder(activeOrder.id, { status: 'completed', payment_method: 'card' });
        } else {
          // New sale flow
          const formattedItems = cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price)
          }));

          await createOrder({
            items: formattedItems,
            customer_name: customerName || 'Walk-in Customer',
            payment_method: 'card',
            status: 'completed',
            notes: `Card Payment - Approval Code: ${code}${notes ? ' - ' + notes : ''}`
          });
        }
        
        setTimeout(() => {
          alert(`Sale completed! Order: ${(activeOrder ? activeOrder.id : 'New Order')}\nApproval Code: ${code}`);
          setShowCardDialog(false);
          setCart([]);
          setCustomerName('');
          setNotes('');
          setApprovalCode('');
          setCardStatus(null);
          sessionStorage.removeItem('pendingOrder');
          setActiveOrder(null);
          
          fetchProducts();
          navigate('/orders');
        }, 1500);
      } catch (error: any) {
        alert('Failed to create order: ' + error.message);
        setCardStatus(null);
      }
    } else {
      setCardStatus('declined');
    }
    
    setCardProcessing(false);
  };

  const handlePutOnHold = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setProcessingOrder(true);
    try {
      const result = await createOrder({
        items: cart,
        customer_name: customerName || 'Walk-in Customer',
        payment_method: 'pending',
        status: 'pending',
        notes: notes || 'Order on hold'
      });
      
      alert(`Order ${result.orderId} placed on hold successfully!`);
      setCart([]);
      setCustomerName('');
      setNotes('');
      
      navigate('/orders');
    } catch (error: any) {
      alert('Failed to place order on hold: ' + error.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => {
    const discount = getActiveDiscount(item);
    const displayPrice = getDiscountedPrice(Number(item.price), discount);
    return sum + (displayPrice * item.quantity);
  }, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {activeOrder && (
          <div className="p-3 bg-yellow-50 rounded border border-yellow-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Processing Pending Order</p>
              <p className="text-sm font-semibold">Order {activeOrder.id} • {(activeOrder.items?.length || 0)} items</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { sessionStorage.removeItem('pendingOrder'); setActiveOrder(null); }}
            >
              Clear
            </Button>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Point of Sale</h1>
            <p className="text-muted-foreground">Select products and manage sales transactions</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <ShoppingCart className="w-5 h-5 mr-2" />
            {cartItemCount} items
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Products</CardTitle>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 mb-4">
                    {categories.slice(0, 4).map((cat) => (
                      <TabsTrigger key={cat.name} value={cat.name} className="text-xs">
                        <span className="mr-1">{cat.icon}</span>
                        {cat.label === 'All Products' ? 'All' : cat.label.split(' ')[0]}
                        {cat.count && <Badge variant="secondary" className="ml-1 text-xs">{cat.count}</Badge>}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {categories.length > 4 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {categories.slice(4).map((cat) => (
                        <Button
                          key={cat.name}
                          variant={selectedCategory === cat.name ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.name)}
                        >
                          <span className="mr-1">{cat.icon}</span>
                          {cat.label}
                          <Badge variant="secondary" className="ml-1">{cat.count}</Badge>
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-6 max-h-[600px] overflow-y-auto">
                    {loading ? (
                      <p className="text-center text-muted-foreground py-8">Loading products...</p>
                    ) : Object.keys(groupedProducts).length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No products available</p>
                      </div>
                    ) : (
                      Object.entries(groupedProducts).map(([category, categoryProducts]) => {
                        const products = categoryProducts as typeof filteredProducts;
                        return (
                        <div key={category} className="space-y-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <span>{categoryIcons[category as keyof typeof categoryIcons] || '📦'}</span>
                            {category}
                            <Badge variant="outline">{products.length} items</Badge>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {products.map((product) => (
                              <Card key={product.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  {product.image_url && (
                                    <div className="mb-3">
                                      <img 
                                        src={product.image_url} 
                                        alt={product.name}
                                        className="w-full h-32 object-cover rounded-md"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm">{product.name}</h4>
                                      <p className="text-xs text-muted-foreground">{product.category}</p>
                                    </div>
                                    <Badge variant={getStockStatus(product.quantity).variant} className="text-xs">
                                      {product.quantity} in stock
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center mt-3">
                                    {(() => {
                                      const discount = getActiveDiscount(product);
                                      if (discount) {
                                        const discountedPrice = getDiscountedPrice(Number(product.price), discount);
                                        return (
                                          <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs line-through text-muted-foreground">${parseFloat(product.price).toFixed(2)}</span>
                                              <span className="text-lg font-bold text-green-600">${discountedPrice.toFixed(2)}</span>
                                            </div>
                                            <Badge className="w-fit bg-red-100 text-red-700 text-xs">{discount.percentage}% OFF</Badge>
                                          </div>
                                        );
                                      }
                                      return <span className="text-lg font-bold text-green-600">${parseFloat(product.price).toFixed(2)}</span>;
                                    })()}
                                    <Button
                                      size="sm"
                                      onClick={() => addToCart(product)}
                                      disabled={product.quantity === 0}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                      })
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Shopping Cart
                  </span>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Cart is empty</p>
                    <p className="text-sm text-muted-foreground">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {cart.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <h4 className="font-medium text-sm">{item.name}</h4>
                                    <p className="text-xs text-muted-foreground">{item.category}</p>
                                  </div>
                                  {(() => {
                                    const discount = getActiveDiscount(item);
                                    if (discount) {
                                      return <Badge className="bg-red-100 text-red-700 text-xs">{discount.percentage}% OFF</Badge>;
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartQuantity(item.id, -1)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartQuantity(item.id, 1)}
                                  disabled={item.quantity >= item.quantity}
                                  className="h-7 w-7 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <span className="text-sm font-bold">
                                ${(() => {
                                  const discount = getActiveDiscount(item);
                                  const displayPrice = getDiscountedPrice(Number(item.price), discount);
                                  return (displayPrice * item.quantity).toFixed(2);
                                })()}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Subtotal:</span>
                        <span className="text-sm font-medium">${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tax (0%):</span>
                        <span className="text-sm font-medium">$0.00</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-lg font-bold text-green-600">${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Select Payment Method</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => {
                              setAmountReceived('');
                              setChange(0);
                              setShowCashDialog(true);
                            }}
                            disabled={cart.length === 0}
                          >
                            <Banknote className="h-4 w-4 mr-2" />
                            Cash
                          </Button>
                          <Button
                            onClick={() => {
                              setCardStatus(null);
                              setApprovalCode('');
                              setShowCardDialog(true);
                            }}
                            disabled={cart.length === 0}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Card
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={handlePutOnHold}
                            disabled={cart.length === 0 || processingOrder}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Hold
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/orders')}
                          >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Orders
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cash Payment Dialog */}
      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Cash Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 rounded-lg text-center border border-green-200">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-green-600">${cartTotal.toFixed(2)}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-cash">Customer Name (Optional)</Label>
              <Input
                id="customer-cash"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount Received</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount..."
                className="text-lg font-semibold"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200">
              <p className="text-sm text-muted-foreground">Change Due</p>
              <p className="text-2xl font-bold text-blue-600">${change.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-cash">Notes (Optional)</Label>
              <Textarea
                id="notes-cash"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCashDialog(false)}
              disabled={processingOrder}
            >
              Cancel
            </Button>
            <Button 
              onClick={processCashPayment}
              disabled={processingOrder || parseFloat(amountReceived) < cartTotal}
            >
              {processingOrder ? 'Processing...' : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Payment Dialog */}
      <Dialog open={showCardDialog} onOpenChange={(open) => {
        if (!cardProcessing) setShowCardDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Card Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 rounded-lg text-center border border-green-200">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-green-600">${cartTotal.toFixed(2)}</p>
            </div>

            {cardStatus === null && (
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-card">Customer Name (Optional)</Label>
                  <Input
                    id="customer-card"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={cardProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes-card">Notes (Optional)</Label>
                  <Textarea
                    id="notes-card"
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    disabled={cardProcessing}
                  />
                </div>
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">Click below to send amount to card terminal</p>
                </div>
              </div>
            )}

            {cardStatus === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600" />
                <p className="mt-4 font-medium">Processing card payment...</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            )}

            {cardStatus === 'approved' && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                <p className="mt-4 font-bold text-green-600 text-lg">Payment Approved!</p>
                <p className="text-sm text-muted-foreground mt-2">Approval Code: {approvalCode}</p>
              </div>
            )}

            {cardStatus === 'declined' && (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto text-red-600" />
                <p className="mt-4 font-bold text-red-600 text-lg">Payment Declined</p>
                <p className="text-sm text-muted-foreground mt-2">Please try another payment method</p>
              </div>
            )}
          </div>
          <DialogFooter>
            {cardStatus === null && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCardDialog(false)}
                  disabled={cardProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={processCardPayment}
                  disabled={cardProcessing}
                >
                  {cardProcessing ? 'Processing...' : 'Process Payment'}
                </Button>
              </>
            )}
            {cardStatus === 'declined' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCardStatus(null);
                    setShowCardDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => setCardStatus(null)}>
                  Try Again
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
