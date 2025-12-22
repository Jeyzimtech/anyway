import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Badge } from 'components/ui/badge';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Tag, Percent, Calendar } from 'lucide-react';
import { listProducts } from '../lib/api';

interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

interface Discount {
  id: number;
  name: string;
  type: "Product" | "Category";
  target: string;
  percentage: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([
    { id: 1, name: "Winter Sale", type: "Category", target: "Engine Oil", percentage: 15, startDate: "2025-01-01", endDate: "2025-03-31", active: true },
    { id: 2, name: "Clearance", type: "Product", target: "Brake Pads Premium", percentage: 25, startDate: "2025-01-15", endDate: "2025-02-15", active: true },
    { id: 3, name: "Summer Promo", type: "Category", target: "Service Kits", percentage: 10, startDate: "2024-12-01", endDate: "2024-12-31", active: false },
  ]);

  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    loadDiscounts();
    fetchProducts();
  }, []);

  const loadDiscounts = () => {
    try {
      const stored = localStorage.getItem('discounts');
      if (stored) {
        const savedDiscounts: Discount[] = JSON.parse(stored);
        setDiscounts(savedDiscounts);
      }
    } catch (e) {
      console.error('Failed to load discounts:', e);
    }
  };

  const saveDiscounts = (updated: Discount[]) => {
    setDiscounts(updated);
    localStorage.setItem('discounts', JSON.stringify(updated));
  };

  const fetchProducts = async () => {
    try {
      const res: any = await listProducts();
      const arr: Product[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.products)
            ? res.products
            : [];
      setProducts(arr || []);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    }
  };

  const [newDiscount, setNewDiscount] = useState({
    name: "",
    type: "Product" as "Product" | "Category",
    target: "",
    percentage: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!newDiscount.name || !newDiscount.target || !newDiscount.percentage || !newDiscount.startDate || !newDiscount.endDate) {
      alert("Please fill in all fields");
      return;
    }

    // Validate product/category exists
    if (newDiscount.type === "Product") {
      const productExists = products.some(p => p.name.toLowerCase() === newDiscount.target.toLowerCase());
      if (!productExists) {
        setProductError("no product name in the product list");
        return;
      }
    } else if (newDiscount.type === "Category") {
      const categoryExists = products.some(p => p.category.toLowerCase() === newDiscount.target.toLowerCase());
      if (!categoryExists) {
        setProductError("no category found in the product list");
        return;
      }
    }

    setProductError("");

    // Prevent overlapping discounts for the same product/category
    const rangesOverlap = (startA: string, endA: string, startB: string, endB: string) => {
      const aStart = new Date(startA);
      aStart.setHours(0, 0, 0, 0);
      const aEnd = new Date(endA);
      aEnd.setHours(23, 59, 59, 999);
      const bStart = new Date(startB);
      bStart.setHours(0, 0, 0, 0);
      const bEnd = new Date(endB);
      bEnd.setHours(23, 59, 59, 999);
      return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
    };

    const overlaps = discounts.some(d => {
      if (editingId && d.id === editingId) return false; // ignore self when editing
      const sameType = d.type === newDiscount.type;
      const sameTarget = d.target.toLowerCase() === newDiscount.target.toLowerCase();
      return sameType && sameTarget && rangesOverlap(newDiscount.startDate, newDiscount.endDate, d.startDate, d.endDate);
    });

    if (overlaps) {
      setFormError("Another discount for this target overlaps the selected dates.");
      return;
    }

    const discount: Discount = {
      id: editingId ?? Date.now(),
      name: newDiscount.name,
      type: newDiscount.type,
      target: newDiscount.target,
      percentage: parseFloat(newDiscount.percentage),
      startDate: newDiscount.startDate,
      endDate: newDiscount.endDate,
      active: true,
    };

    let updatedDiscounts: Discount[] = [];
    if (editingId) {
      updatedDiscounts = discounts.map(d => (d.id === editingId ? discount : d));
      saveDiscounts(updatedDiscounts);
      alert("Discount updated successfully");
    } else {
      updatedDiscounts = [discount, ...discounts];
      saveDiscounts(updatedDiscounts);
      alert("Discount created successfully");
    }
    
    setNewDiscount({
      name: "",
      type: "Product",
      target: "",
      percentage: "",
      startDate: "",
      endDate: "",
    });
    setEditingId(null);
  };

  const handleDeleteDiscount = (id: number) => {
    const updated = discounts.filter(d => d.id !== id);
    saveDiscounts(updated);
    if (editingId === id) {
      setEditingId(null);
      setNewDiscount({ name: "", type: "Product", target: "", percentage: "", startDate: "", endDate: "" });
    }
  };

  const handleEditDiscountStart = (d: Discount) => {
    setEditingId(d.id);
    setNewDiscount({
      name: d.name,
      type: d.type,
      target: d.target,
      percentage: String(d.percentage),
      startDate: d.startDate,
      endDate: d.endDate,
    });
    setProductError("");
    setFormError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewDiscount({ name: "", type: "Product", target: "", percentage: "", startDate: "", endDate: "" });
    setProductError("");
    setFormError("");
  };

  const calculateDiscountedPrice = (originalPrice: number, percentage: number) => {
    return (originalPrice * (1 - percentage / 100)).toFixed(2);
  };

  const getCategories = (): string[] => {
    const uniqueCategories = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  };

  const getProductNames = (): string[] => {
    return products.map(p => p.name).sort();
  };

  const isDiscountActiveToday = (discount: Discount): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return today >= discount.startDate && today <= discount.endDate;
  };

  const getAffectedProducts = (discount: Discount): Product[] => {
    if (discount.type === "Product") {
      return products.filter(p => p.name.toLowerCase() === discount.target.toLowerCase());
    } else {
      return products.filter(p => p.category.toLowerCase() === discount.target.toLowerCase());
    }
  };

  const getDiscountStatus = (discount: Discount): "past" | "current" | "future" => {
    const today = new Date().toISOString().split('T')[0];
    if (today > discount.endDate) return "past";
    if (today < discount.startDate) return "future";
    return "current";
  };

  const getProductDiscounts = (productName: string): Discount[] => {
    return discounts.filter(d => d.type === "Product" && d.target.toLowerCase() === productName.toLowerCase());
  };

  const getCategoryDiscounts = (categoryName: string): Discount[] => {
    return discounts.filter(d => d.type === "Category" && d.target.toLowerCase() === categoryName.toLowerCase());
  };

  const getStatusBadgeColor = (status: "past" | "current" | "future") => {
    if (status === "current") return { bg: "#38A169", text: "#FFFFFF", label: "Active Now" };
    if (status === "future") return { bg: "#0883A4", text: "#FFFFFF", label: "Coming Soon" };
    return { bg: "#E2E8F0", text: "#4A5568", label: "Expired" };
  };

  return (


    <>
<main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1A202C' }}>Discounts</h1>
            <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2" style={{ color: '#4A5568' }}>Create and manage promotional discounts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Active Discounts Today</CardTitle>
                <Tag className="h-4 w-4" style={{ color: '#38A169' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                  {discounts.filter(d => isDiscountActiveToday(d)).length}
                </div>
                <p className="text-xs" style={{ color: '#718096' }}>Running today</p>
              </CardContent>
            </Card>

            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Total Discounts</CardTitle>
                <Percent className="h-4 w-4" style={{ color: '#0883A4' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>{discounts.length}</div>
                <p className="text-xs" style={{ color: '#718096' }}>All discounts</p>
              </CardContent>
            </Card>

            <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ padding: '24px', paddingBottom: '8px' }}>
                <CardTitle className="text-sm font-semibold" style={{ color: '#718096' }}>Avg Discount</CardTitle>
                <Percent className="h-4 w-4" style={{ color: '#F59E0B' }} />
              </CardHeader>
              <CardContent style={{ padding: '24px', paddingTop: '8px' }}>
                <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                  {discounts.length > 0
                    ? Math.round(discounts.reduce((sum, d) => sum + d.percentage, 0) / discounts.length)
                    : 0}%
                </div>
                <p className="text-xs" style={{ color: '#718096' }}>Average rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Discount Form */}
            <div className="lg:col-span-1">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Create New Discount</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Discount Name <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="name"
                        value={newDiscount.name}
                        onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                        placeholder="e.g., Winter Sale"
                        required
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Type <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Select value={newDiscount.type} onValueChange={(value: "Product" | "Category") => setNewDiscount({ ...newDiscount, type: value, target: "" })}>
                        <SelectTrigger id="type" className="h-11 border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Product">Specific Product</SelectItem>
                          <SelectItem value="Category">Product Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        {newDiscount.type} Name <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Select value={newDiscount.target} onValueChange={(value) => { setNewDiscount({ ...newDiscount, target: value }); setProductError(""); }}>
                        <SelectTrigger 
                          id="target" 
                          className="h-11 border" 
                          style={{ 
                            borderColor: productError ? '#E53E3E' : '#E2E8F0', 
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF'
                          }}
                        >
                          <SelectValue placeholder={`Select ${newDiscount.type.toLowerCase()}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {newDiscount.type === "Product" 
                            ? getProductNames().map(name => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))
                            : getCategories().map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                      {productError && (
                        <p style={{ color: '#E53E3E', fontSize: '0.875rem', marginTop: '4px' }}>
                          {productError}
                        </p>
                      )}
                      {formError && (
                        <p style={{ color: '#E53E3E', fontSize: '0.875rem', marginTop: '4px' }}>
                          {formError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="percentage" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Discount Percentage (%) <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="percentage"
                        type="number"
                        value={newDiscount.percentage}
                        onChange={(e) => setNewDiscount({ ...newDiscount, percentage: e.target.value })}
                        placeholder="0"
                        min="0"
                        max="100"
                        required
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        Start Date <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newDiscount.startDate}
                        onChange={(e) => setNewDiscount({ ...newDiscount, startDate: e.target.value })}
                        required
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-semibold" style={{ color: '#1A202C' }}>
                        End Date <span style={{ color: '#E53E3E' }}>*</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newDiscount.endDate}
                        onChange={(e) => setNewDiscount({ ...newDiscount, endDate: e.target.value })}
                        required
                        className="h-11 border"
                        style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        className="h-12 font-bold flex-1" 
                        style={{ backgroundColor: '#0883A4', color: '#FFFFFF', borderRadius: '8px' }}
                      >
                        {editingId ? 'Update Discount' : 'Create Discount'}
                      </Button>
                      {editingId && (
                        <Button 
                          type="button" 
                          className="h-12 font-bold flex-1" 
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Active Discounts List */}
            <div className="lg:col-span-2">
              <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                <CardHeader style={{ padding: '24px', paddingBottom: '16px' }}>
                  <CardTitle className="text-lg font-bold" style={{ color: '#1A202C' }}>Active Discounts</CardTitle>
                </CardHeader>
                <CardContent style={{ padding: '24px', paddingTop: '16px' }}>
                  <div className="space-y-4">
                    {discounts.filter(d => isDiscountActiveToday(d)).length === 0 ? (
                      <p style={{ color: '#718096', textAlign: 'center', padding: '24px' }}>
                        No active discounts today
                      </p>
                    ) : (
                      discounts.filter(d => isDiscountActiveToday(d)).map((discount) => {
                        const affectedProducts = getAffectedProducts(discount);
                        return (
                          <div key={discount.id}>
                            <div
                              className="p-4 border mb-3"
                              style={{ borderColor: '#E2E8F0', borderRadius: '8px', backgroundColor: '#F7FAFC' }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm" style={{ color: '#1A202C' }}>{discount.name}</h3>
                                    <Badge 
                                      style={{
                                        backgroundColor: '#38A169',
                                        color: '#FFFFFF',
                                        borderRadius: '12px',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      Active Today
                                    </Badge>
                                  </div>
                                  <p className="text-xs mt-1" style={{ color: '#718096' }}>
                                    {discount.type}: {discount.target}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold" style={{ color: '#38A169' }}>{discount.percentage}%</div>
                                  <p className="text-xs" style={{ color: '#718096' }}>OFF</p>
                                </div>
                              </div>

                              {affectedProducts.length > 0 ? (
                                <div className="border-t" style={{ borderColor: '#E2E8F0', paddingTop: '12px', marginTop: '12px' }}>
                                  <p className="text-xs font-semibold mb-2" style={{ color: '#4A5568' }}>Products:</p>
                                  <div className="space-y-2">
                                    {affectedProducts.map((product) => {
                                      const price = Number(product.price);
                                      return (
                                      <div key={product.id} className="flex items-center justify-between text-sm" style={{ padding: '8px 0' }}>
                                        <span style={{ color: '#1A202C' }}>{product.name}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="line-through" style={{ color: '#718096' }}>
                                            ${price.toFixed(2)}
                                          </span>
                                          <span className="font-semibold" style={{ color: '#38A169' }}>
                                            ${calculateDiscountedPrice(price, discount.percentage)}
                                          </span>
                                        </div>
                                      </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs" style={{ color: '#718096', paddingTop: '8px' }}>
                                    No matching products found
                                  </p>
                                  <div className="flex gap-2 pt-3">
                                    <Button size="sm" variant="outline" onClick={() => handleEditDiscountStart(discount)}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteDiscount(discount.id)}>Delete</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                  {/* Manage Discounts Table */}
                  <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4" style={{ color: '#1A202C' }}>Manage Discounts</h2>
                    <Card className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                      <CardContent style={{ padding: '16px' }}>
                        {discounts.length === 0 ? (
                          <p style={{ color: '#718096' }}>No discounts available</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b" style={{ borderColor: '#E2E8F0' }}>
                                  <th className="text-left py-2 px-3">Name</th>
                                  <th className="text-left py-2 px-3">Type</th>
                                  <th className="text-left py-2 px-3">Target</th>
                                  <th className="text-center py-2 px-3">% Off</th>
                                  <th className="text-center py-2 px-3">Start</th>
                                  <th className="text-center py-2 px-3">End</th>
                                  <th className="text-center py-2 px-3">Status</th>
                                  <th className="text-center py-2 px-3">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {discounts.map((d) => {
                                  const status = getDiscountStatus(d);
                                  const colors = getStatusBadgeColor(status);
                                  return (
                                    <tr key={d.id} className="border-b" style={{ borderColor: '#E2E8F0' }}>
                                      <td className="py-2 px-3 font-medium" style={{ color: '#1A202C' }}>{d.name}</td>
                                      <td className="py-2 px-3">{d.type}</td>
                                      <td className="py-2 px-3">{d.target}</td>
                                      <td className="py-2 px-3 text-center">{d.percentage}%</td>
                                      <td className="py-2 px-3 text-center">{d.startDate}</td>
                                      <td className="py-2 px-3 text-center">{d.endDate}</td>
                                      <td className="py-2 px-3 text-center">
                                        <Badge style={{ backgroundColor: colors.bg, color: colors.text }}>{colors.label}</Badge>
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <div className="flex justify-center gap-2">
                                          <Button size="sm" variant="outline" onClick={() => handleEditDiscountStart(d)}>Edit</Button>
                                          <Button size="sm" variant="destructive" onClick={() => handleDeleteDiscount(d.id)}>Delete</Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Products and Categories Discount History */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1A202C' }}>Products & Categories Discount History</h2>
            
            {/* Products Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D3748' }}>Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.length === 0 ? (
                  <p style={{ color: '#718096' }}>No products found</p>
                ) : (
                  products.map((product) => {
                    const productDiscounts = getProductDiscounts(product.name);
                    return (
                      <Card key={product.id} className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                        <CardHeader style={{ padding: '16px', paddingBottom: '12px' }}>
                          <CardTitle className="text-sm font-bold" style={{ color: '#1A202C' }}>{product.name}</CardTitle>
                          <p className="text-xs mt-1" style={{ color: '#718096' }}>{product.category}</p>
                        </CardHeader>
                        <CardContent style={{ padding: '16px', paddingTop: '0px' }}>
                          <div className="mb-3 pb-3 border-b" style={{ borderColor: '#E2E8F0' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#4A5568' }}>Price:</p>
                            <p className="text-lg font-bold" style={{ color: '#1A202C' }}>
                              ${Number(product.price).toFixed(2)}
                            </p>
                          </div>
                          {productDiscounts.length === 0 ? (
                            <p className="text-xs" style={{ color: '#A0AEC0' }}>No discounts</p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold" style={{ color: '#4A5568' }}>Discounts:</p>
                              {productDiscounts.map((discount) => {
                                const status = getDiscountStatus(discount);
                                const colors = getStatusBadgeColor(status);
                                return (
                                  <div key={discount.id} className="p-2 rounded" style={{ backgroundColor: '#F7FAFC' }}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold" style={{ color: '#1A202C' }}>{discount.name}</span>
                                      <Badge style={{ backgroundColor: colors.bg, color: colors.text, borderRadius: '12px', padding: '2px 8px', fontSize: '0.65rem' }}>
                                        {colors.label}
                                      </Badge>
                                    </div>
                                    <p className="text-xs" style={{ color: '#718096' }}>{discount.percentage}% OFF</p>
                                    <p className="text-xs" style={{ color: '#A0AEC0' }}>{discount.startDate} to {discount.endDate}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            {/* Categories Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D3748' }}>Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getCategories().length === 0 ? (
                  <p style={{ color: '#718096' }}>No categories found</p>
                ) : (
                  getCategories().map((category) => {
                    const categoryDiscounts = getCategoryDiscounts(category);
                    const categoryProducts = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
                    return (
                      <Card key={category} className="bg-white border" style={{ borderColor: '#E2E8F0', borderRadius: '8px' }}>
                        <CardHeader style={{ padding: '16px', paddingBottom: '12px' }}>
                          <CardTitle className="text-sm font-bold" style={{ color: '#1A202C' }}>{category}</CardTitle>
                          <p className="text-xs mt-1" style={{ color: '#718096' }}>{categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}</p>
                        </CardHeader>
                        <CardContent style={{ padding: '16px', paddingTop: '0px' }}>
                          {categoryDiscounts.length === 0 ? (
                            <p className="text-xs" style={{ color: '#A0AEC0' }}>No discounts</p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold" style={{ color: '#4A5568' }}>Discounts:</p>
                              {categoryDiscounts.map((discount) => {
                                const status = getDiscountStatus(discount);
                                const colors = getStatusBadgeColor(status);
                                return (
                                  <div key={discount.id} className="p-2 rounded" style={{ backgroundColor: '#F7FAFC' }}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold" style={{ color: '#1A202C' }}>{discount.name}</span>
                                      <Badge style={{ backgroundColor: colors.bg, color: colors.text, borderRadius: '12px', padding: '2px 8px', fontSize: '0.65rem' }}>
                                        {colors.label}
                                      </Badge>
                                    </div>
                                    <p className="text-xs" style={{ color: '#718096' }}>{discount.percentage}% OFF</p>
                                    <p className="text-xs" style={{ color: '#A0AEC0' }}>{discount.startDate} to {discount.endDate}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
