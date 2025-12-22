import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Upload, Barcode, Edit, Trash2, Search, Filter, DollarSign } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../lib/api';
import { loadDiscounts, getActiveDiscount as getActiveDis, getDiscountedPrice, type Discount } from '../lib/discountUtils';

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  cost_price: number | null;
  tax: number;
  category: string;
  image_url: string | null;
  barcode: string | null;
}

const AddProduct = () => {
  const { user, isAdmin } = useAuth();
  const [productData, setProductData] = useState({
    name: "",
    quantity: "",
    price: "",
    cost_price: "",
    tax: "",
    category: "",
    barcode: "",
    image: null as File | null,
    imagePreview: "" as string,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const getActiveDiscount = (product: any): Discount | null => {
    return getActiveDis(product, discounts);
  };

  const categories = [
    "Motor Spare Parts",
    "Engine Oil",
    "Grease",
    "Hydraulic Oil",
    "Transmission Oil",
    "Service Kits",
  ];

  useEffect(() => {
    fetchProducts();
    setDiscounts(loadDiscounts());
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await listProducts({ page: 1, pageSize: 100, q: "" });
      // Handle different response structures
      const productList = response.products || response.items || response || [];
      setProducts(Array.isArray(productList) ? productList : []);
    } catch (error) {
      toast.error('Failed to fetch products');
      console.error(error);
      setProducts([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProductData(prev => ({ ...prev, [field]: value }));
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions (max 800x800 while maintaining aspect ratio)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to JPEG with 0.7 quality for better compression
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            resolve(resizedBase64);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
      if (!validImageTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP, SVG, BMP)");
        return;
      }

      // Check file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }

      try {
        toast.info("Compressing image...");
        // Resize and compress image
        const resizedBase64 = await resizeImage(file);
        
        // Check compressed size
        const compressedSize = (resizedBase64.length * 3) / 4; // Approximate bytes
        const compressedMB = (compressedSize / (1024 * 1024)).toFixed(2);
        
        setProductData(prev => ({ ...prev, image: file, imagePreview: resizedBase64 }));
        toast.success(`Image compressed successfully (${compressedMB}MB)`);
      } catch (error) {
        toast.error("Failed to process image");
        console.error(error);
      }
    }
  };

  const handleBarcodeScam = () => {
    toast.info("Barcode scanner activated");
    setTimeout(() => {
      setProductData({
        name: "Engine Oil 5W-30",
        quantity: "10",
        price: "45.99",
        cost_price: "30.00",
        tax: "8",
        category: "Engine Oil",
        barcode: "1234567890123",
        image: null,
        imagePreview: "",
      });
      toast.success("Product details auto-filled from barcode");
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productData.name || !productData.quantity || !productData.price || !productData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const result = await createProduct({
        name: productData.name,
        quantity: parseInt(productData.quantity),
        price: parseFloat(productData.price),
        cost_price: productData.cost_price ? parseFloat(productData.cost_price) : null,
        tax: parseFloat(productData.tax || "0"),
        category: productData.category,
        barcode: productData.barcode || null,
        image_url: productData.imagePreview || null,
      });

      console.log("Product created:", result);

      toast.success("Product added successfully!", {
        description: `${productData.name} has been added to inventory`,
      });

      setProductData({
        name: "",
        quantity: "",
        price: "",
        cost_price: "",
        tax: "",
        category: "",
        barcode: "",
        image: null,
        imagePreview: "",
      });

      await fetchProducts();
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    setLoading(true);
    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        quantity: editingProduct.quantity,
        price: editingProduct.price,
        cost_price: editingProduct.cost_price,
        tax: editingProduct.tax,
        category: editingProduct.category,
      });

      alert("Product updated successfully!");
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      alert(error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully!");
      setIsDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  const openDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (


    <>
<main style={{ backgroundColor: "#F8FAFC" }} className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <div style={{ maxWidth: "1400px", margin: "0 auto" }} className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Form Section - 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1A202C" }}>
                Add Product
              </h1>
              <p style={{ fontSize: "14px", color: "#718096", marginTop: "8px" }}>
                Add a new product to your inventory
              </p>
            </div>

            <Card style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}>
              <CardHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "24px" }}>
                <CardTitle style={{ fontSize: "18px", fontWeight: "600", color: "#1A202C" }}>
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: "24px", paddingTop: "16px" }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                      Product Name <span style={{ color: "#E53E3E" }}>*</span>
                    </Label>
                    <Input
                      value={productData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter product name"
                      required
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  {/* Barcode */}
                  <div className="space-y-2">
                    <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                      Barcode
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={productData.barcode}
                        onChange={(e) => handleInputChange("barcode", e.target.value)}
                        placeholder="Enter barcode"
                        style={{
                          height: "44px",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleBarcodeScam}
                        style={{
                          height: "44px",
                          borderColor: "#E2E8F0",
                          color: "#0883A4",
                          borderRadius: "8px",
                        }}
                        variant="outline"
                      >
                        <Barcode className="h-4 w-4 mr-2" />
                        Scan
                      </Button>
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                        Quantity <span style={{ color: "#E53E3E" }}>*</span>
                      </Label>
                      <Input
                        type="number"
                        value={productData.quantity}
                        onChange={(e) => handleInputChange("quantity", e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                        style={{
                          height: "44px",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                        Selling Price ($) <span style={{ color: "#E53E3E" }}>*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={productData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        placeholder="0.00"
                        min="0"
                        required
                        style={{
                          height: "44px",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Admin-Only Cost Price */}
                  {isAdmin && (
                    <div
                      className="space-y-2 p-4"
                      style={{
                        backgroundColor: "#EFF8FF",
                        borderColor: "#0883A4",
                        borderWidth: "2px",
                        borderRadius: "8px",
                      }}
                    >
                      <Label
                        className="flex items-center gap-2"
                        style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}
                      >
                        <DollarSign className="h-4 w-4" style={{ color: "#0883A4" }} />
                        Buying Price from Supplier (Admin Only)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={productData.cost_price}
                        onChange={(e) => handleInputChange("cost_price", e.target.value)}
                        placeholder="0.00"
                        min="0"
                        style={{
                          height: "44px",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                      <p style={{ fontSize: "12px", color: "#718096" }}>
                        This is the price you pay to suppliers. Used for profit calculations.
                      </p>
                    </div>
                  )}

                  {/* Tax & Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                        Tax (%)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={productData.tax}
                        onChange={(e) => handleInputChange("tax", e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        style={{
                          height: "44px",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                        Category <span style={{ color: "#E53E3E" }}>*</span>
                      </Label>
                      <Select value={productData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger
                          style={{
                            height: "44px",
                            borderColor: "#E2E8F0",
                            borderRadius: "8px",
                          }}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                      Product Image
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                      }}
                      className="cursor-pointer"
                    />
                    {productData.imagePreview && (
                      <div className="mt-2">
                        <img 
                          src={productData.imagePreview} 
                          alt="Preview"
                          style={{
                            width: "100%",
                            maxHeight: "200px",
                            objectFit: "contain",
                            borderRadius: "8px",
                            border: "1px solid #E2E8F0"
                          }}
                        />
                        <p style={{ fontSize: "12px", color: "#38A169", marginTop: "8px" }}>
                          ✓ {productData.image?.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      style={{
                        height: "48px",
                        backgroundColor: "#0883A4",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        fontWeight: "600",
                      }}
                      className="flex-1"
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {loading ? "Adding..." : "Add Product"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        setProductData({
                          name: "",
                          quantity: "",
                          price: "",
                          cost_price: "",
                          tax: "",
                          category: "",
                          barcode: "",
                          image: null,
                          imagePreview: "",
                        })
                      }
                      style={{
                        height: "48px",
                        borderColor: "#E2E8F0",
                        color: "#1A202C",
                        borderRadius: "8px",
                      }}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Product List Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1A202C" }}>
                Product List
              </h2>
              <p style={{ fontSize: "14px", color: "#718096", marginTop: "8px" }}>
                Manage existing products
              </p>
            </div>

            <Card style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}>
              <CardHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "24px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <CardTitle style={{ fontSize: "18px", fontWeight: "600", color: "#1A202C" }}>
                    Products ({filteredProducts.length})
                  </CardTitle>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: "#718096" }}
                    />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        paddingLeft: "36px",
                      }}
                    />
                  </div>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        width: "auto",
                        minWidth: "200px",
                      }}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent style={{ padding: "24px", paddingTop: "16px" }}>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#718096",
                        padding: "32px",
                        fontSize: "14px",
                        fontStyle: "italic",
                      }}
                    >
                      {products.length === 0
                        ? "No products added yet"
                        : "No products match your search"}
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4"
                        style={{
                          borderColor: "#E2E8F0",
                          borderWidth: "1px",
                          borderRadius: "8px",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={
                              product.image_url ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
                            }
                            alt={product.name}
                            style={{
                              width: "48px",
                              height: "48px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop";
                            }}
                          />
                          <div className="flex-1">
                            <h3
                              style={{
                                fontWeight: "600",
                                color: "#1A202C",
                              }}
                            >
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                style={{
                                  backgroundColor: "#EFF8FF",
                                  color: "#0883A4",
                                  border: "1px solid #0883A4",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {product.category}
                              </Badge>
                              <span style={{ fontSize: "14px", color: "#4A5568" }}>
                                ${(() => {
                                  const discount = getActiveDiscount(product);
                                  const displayPrice = getDiscountedPrice(product.price, discount);
                                  return displayPrice.toFixed(2);
                                })()}
                              </span>
                              <span style={{ fontSize: "14px", color: "#718096" }}>
                                • {product.quantity} units
                              </span>
                            </div>
                            {isAdmin && product.cost_price && (
                              <span style={{ fontSize: "12px", color: "#0883A4", marginTop: "4px", display: "block", fontWeight: "500" }}>
                                Cost: ${Number(product.cost_price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                            style={{
                              width: "36px",
                              height: "36px",
                              color: "#0883A4",
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteConfirm(product)}
                            style={{
                              width: "36px",
                              height: "36px",
                              color: "#E53E3E",
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "8px",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ fontSize: "18px", fontWeight: "600", color: "#1A202C" }}>
                Edit Product
              </DialogTitle>
            </DialogHeader>

            {editingProduct && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                    Product Name
                  </Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    style={{
                      height: "44px",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                      Quantity
                    </Label>
                    <Input
                      type="number"
                      value={editingProduct.quantity}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                      Selling Price ($)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div
                    className="space-y-2 p-4"
                    style={{
                      backgroundColor: "#EFF8FF",
                      borderColor: "#0883A4",
                      borderWidth: "2px",
                      borderRadius: "8px",
                    }}
                  >
                    <Label
                      className="flex items-center gap-2"
                      style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}
                    >
                      <DollarSign className="h-4 w-4" style={{ color: "#0883A4" }} />
                      Buying Price (Admin Only)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.cost_price || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          cost_price: parseFloat(e.target.value) || null,
                        })
                      }
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                      Tax (%)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.tax}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          tax: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{
                        height: "44px",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ fontSize: "14px", fontWeight: "700", color: "#1A202C" }}>
                      Category
                    </Label>
                    <Select
                      value={editingProduct.category}
                      onValueChange={(value) =>
                        setEditingProduct({ ...editingProduct, category: value })
                      }
                    >
                      <SelectTrigger
                        style={{
                          height: "44px",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                style={{
                  borderColor: "#E2E8F0",
                  color: "#4A5568",
                  borderRadius: "8px",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={loading}
                style={{
                  height: "44px",
                  backgroundColor: "#0883A4",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  fontWeight: "600",
                }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "8px",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ fontSize: "18px", fontWeight: "600", color: "#1A202C" }}>
                Delete Product
              </DialogTitle>
            </DialogHeader>

            {productToDelete && (
              <div className="space-y-4">
                <p style={{ color: "#4A5568", fontSize: "14px" }}>
                  Are you sure you want to delete <span style={{ fontWeight: "600", color: "#1A202C" }}>{productToDelete.name}</span>?
                </p>
                <p style={{ color: "#718096", fontSize: "13px" }}>
                  This action cannot be undone. All data associated with this product will be permanently removed.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                style={{
                  borderColor: "#E2E8F0",
                  color: "#4A5568",
                  borderRadius: "8px",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => productToDelete && handleDeleteProduct(productToDelete.id)}
                disabled={loading}
                style={{
                  height: "44px",
                  backgroundColor: "#E53E3E",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  fontWeight: "600",
                }}
              >
                {loading ? "Deleting..." : "Delete Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
};

export default AddProduct;
