import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Badge } from 'components/ui/badge';
import { Package, Edit, DollarSign, Search, Filter } from 'lucide-react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { listProducts, updateProduct, getSettings } from '../lib/api';
import { loadDiscounts, getActiveDiscount as getActiveDis, getDiscountedPrice, type Discount } from '../lib/discountUtils';

interface Category {
  name: string;
  productCount: number;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  cost_price: number | null;
  category: string;
  image_url: string | null;
}

const ManageProducts = () => {
  const isAdmin = true; // TODO: Wire real roles from auth
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [settings, setSettings] = useState<any>({ lowStockThreshold: 20, criticalStockThreshold: 5 });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const getActiveDiscount = (product: Product): Discount | null => {
    return getActiveDis(product, discounts);
  };

  const money = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    setDiscounts(loadDiscounts());
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
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
    } catch (error) {
      alert('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const categories: Category[] = useMemo(() => {
    const counts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, productCount]) => ({
      name,
      productCount,
      icon: '📦',
    }));
  }, [products]);

  const getStockStatus = (quantity: number) => {
    if (quantity <= settings.criticalStockThreshold) return { status: "Critical", variant: "destructive" as const };
    if (quantity <= settings.lowStockThreshold) return { status: "Low Stock", variant: "secondary" as const };
    return { status: "In Stock", variant: "default" as const };
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (lowStockOnly) list = list.filter(p => p.quantity <= settings.lowStockThreshold);
    return list;
  }, [products, selectedCategory, search, lowStockOnly, settings.lowStockThreshold]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        quantity: editingProduct.quantity,
        price: editingProduct.price,
        cost_price: editingProduct.cost_price,
      });

      alert('Product updated successfully!');
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      alert(error.message || 'Failed to update product');
    }
  };

  return (
    <>
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <div className="space-y-4 md:space-y-6">
          {/* Controls (no page header) */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or category"
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant={lowStockOnly ? 'default' : 'outline'}
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                >
                  <Filter className="h-4 w-4 mr-2" /> Low stock
                </Button>
                {selectedCategory && (
                  <Button variant="outline" onClick={() => setSelectedCategory(null)}>Clear category</Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold">{products.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold">{categories.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Low stock (≤{settings.lowStockThreshold})</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold">{products.filter(p => p.quantity <= settings.lowStockThreshold).length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Critical (≤{settings.criticalStockThreshold})</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold">{products.filter(p => p.quantity <= settings.criticalStockThreshold).length}</div></CardContent>
              </Card>
            </div>
          )}

          {/* Category chips */}
          {!loading && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button
                  key={c.name}
                  variant={selectedCategory === c.name ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(selectedCategory === c.name ? null : c.name)}
                  className="h-8"
                >
                  <span className="mr-2">{c.icon}</span>
                  {c.name}
                  <span className="ml-2 text-xs opacity-70">{c.productCount}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Products list */}
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading products...</p>
          ) : (
            <Card>
              <CardContent className="pt-6">
                {filteredProducts.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No matching products</p>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => {
                      const stockInfo = getStockStatus(product.quantity);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="p-3 rounded-lg bg-primary/10">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-foreground">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="font-semibold">
                                  ${(() => {
                                    const discount = getActiveDiscount(product);
                                    const displayPrice = getDiscountedPrice(Number(product.price), discount);
                                    return money(displayPrice);
                                  })()}
                                </span>
                                {isAdmin && product.cost_price != null && (
                                  <span className="text-xs text-primary flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> {money(product.cost_price)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{product.quantity} units</p>
                              <Badge variant={stockInfo.variant}>{stockInfo.status}</Badge>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                                title="Edit product"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={editingProduct.quantity}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      quantity: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {isAdmin && (
                <div className="space-y-2 p-3 border border-primary/20 rounded-lg bg-primary/5">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Buying Price (Admin Only)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.cost_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) || null })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageProducts;
