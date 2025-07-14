
import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Wrench, CheckCircle, Clock, Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Product {
  id: number;
  name: string;
  sku: string;
  status: string;
  stock_quantity: number;
  price: number;
  description?: string;
  specifications?: string;
  category_id?: number;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category_id: string;
  price: string;
  stock_quantity: string;
  status: string;
  specifications: string;
}

export const ProductsManager = () => {
  const { apiFetch } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    description: "",
    category_id: "",
    price: "",
    stock_quantity: "",
    status: "active",
    specifications: ""
  });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; productId: number | null }>({ open: false, productId: null });

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      category_id: "",
      price: "",
      stock_quantity: "",
      status: "active",
      specifications: ""
    });
  };

  // Add new product
  const handleAddProduct = async () => {
    try {
      const response = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category_id: parseInt(formData.category_id),
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          status: formData.status,
          specifications: formData.specifications
        })
      });

      if (response.ok) {
        toast.success("Product added successfully");
        setShowAdd(false);
        resetForm();
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add product");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Edit product
  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await apiFetch(`/products/${selectedProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category_id: parseInt(formData.category_id),
          price: parseFloat(formData.price),
          status: formData.status,
          specifications: formData.specifications
        })
      });

      if (response.ok) {
        toast.success("Product updated successfully");
        setShowEdit(false);
        resetForm();
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update product");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: number) => {
    try {
      const response = await apiFetch(`/products/${productId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Mark product as available
  const handleMarkAvailable = async (productId: number) => {
    try {
      const response = await apiFetch(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "active" })
      });

      if (response.ok) {
        toast.success("Product marked as available");
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update product");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      category_id: product.category_id?.toString() || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      status: product.status,
      specifications: product.specifications || ""
    });
    setShowEdit(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "inactive": return <Clock className="h-4 w-4 text-blue-600" />;
      case "discontinued": return <Wrench className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive": return <Badge className="bg-blue-100 text-blue-800">Inactive</Badge>;
      case "discontinued": return <Badge className="bg-orange-100 text-orange-800">Discontinued</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statusCounts = {
    active: products.filter(p => p.status === "active").length,
    inactive: products.filter(p => p.status === "inactive").length,
    discontinued: products.filter(p => p.status === "discontinued").length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Product Inventory</h2>
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Inventory</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">{statusCounts.active}</div>
                <div className="text-sm text-green-600">Active Products</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-700">{statusCounts.inactive}</div>
                <div className="text-sm text-blue-600">Inactive</div>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-700">{statusCounts.discontinued}</div>
                <div className="text-sm text-orange-600">Discontinued</div>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="text-sm text-gray-600 mt-1">SKU: {product.sku}</div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(product.status)}
                  {getStatusBadge(product.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Quantity</div>
                  <div className="font-semibold text-lg">{product.stock_quantity}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Price</div>
                  <div className="font-semibold">${product.price}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-semibold">{product.category_name || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="font-semibold text-sm">{new Date(product.updated_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(product)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedProduct(product); setShowDetails(true); }}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setConfirmDelete({ open: true, productId: product.id })}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                {product.status !== "active" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 border-green-300"
                    onClick={() => handleMarkAvailable(product.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Available
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <div className="space-y-2 mt-2">
                  <div><b>Name:</b> {selectedProduct.name}</div>
                  <div><b>SKU:</b> {selectedProduct.sku}</div>
                  <div><b>Status:</b> {selectedProduct.status}</div>
                  <div><b>Quantity:</b> {selectedProduct.stock_quantity}</div>
                  <div><b>Price:</b> ${selectedProduct.price}</div>
                  <div><b>Category:</b> {selectedProduct.category_name || "N/A"}</div>
                  <div><b>Description:</b> {selectedProduct.description || "N/A"}</div>
                  <div><b>Specifications:</b> {selectedProduct.specifications || "N/A"}</div>
                  <div><b>Created:</b> {new Date(selectedProduct.created_at).toLocaleDateString()}</div>
                  <div><b>Updated:</b> {new Date(selectedProduct.updated_at).toLocaleDateString()}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Enter SKU"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category ID</Label>
                <Input
                  id="category"
                  type="number"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange("category_id", e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Stock Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange("stock_quantity", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="specifications">Specifications</Label>
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) => handleInputChange("specifications", e.target.value)}
                placeholder="Enter specifications"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category ID</Label>
                <Input
                  id="edit-category"
                  type="number"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange("category_id", e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-specifications">Specifications</Label>
                <Input
                  id="edit-specifications"
                  value={formData.specifications}
                  onChange={(e) => handleInputChange("specifications", e.target.value)}
                  placeholder="Enter specifications"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEdit(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct}>Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Product?"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setConfirmDelete({ open: false, productId: null })}
        onConfirm={() => {
          if (confirmDelete.productId) handleDeleteProduct(confirmDelete.productId);
          setConfirmDelete({ open: false, productId: null });
        }}
      />
    </div>
  );
};
