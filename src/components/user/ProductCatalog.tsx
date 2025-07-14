
import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Package, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  description?: string;
  specifications?: string;
  category_name?: string;
  status: string;
}

interface ProductCatalogProps {
  onAddToCart: (product: any, quantity: number) => void;
}

export const ProductCatalog = ({ onAddToCart }: ProductCatalogProps) => {
  const { apiFetch } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/products");
      if (response.ok) {
        const data = await response.json();
        // Filter only active products for agencies
        const activeProducts = (data.products || []).filter((product: Product) => 
          product.status === 'active' && product.stock_quantity > 0
        );
        setProducts(activeProducts);
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleQuantityChange = (productId: number, quantity: number) => {
    setQuantities({ ...quantities, [productId]: quantity });
  };

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    if (quantity > product.stock_quantity) {
      toast.error(`Only ${product.stock_quantity} units available`);
      return;
    }
    onAddToCart(product, quantity);
    toast.success(`Added ${quantity} ${product.name}(s) to cart`);
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
        <Badge variant="secondary">{filteredProducts.length} Products Available</Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="text-sm text-gray-600 mt-1">SKU: {product.sku}</div>
                  <Badge variant="outline" className="mt-2">{product.category_name || 'Uncategorized'}</Badge>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Available</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{product.description || 'No description available'}</p>
                
                <div className="space-y-2">
                  {product.specifications && (
                    <div className="text-sm">
                      <span className="font-medium">Specifications:</span> {product.specifications}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Available:</span> {product.stock_quantity} units
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    ${product.price} per unit
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`quantity-${product.id}`} className="text-sm">
                      Quantity
                    </Label>
                    <Input
                      id={`quantity-${product.id}`}
                      type="number"
                      min="1"
                      max={product.stock_quantity}
                      value={quantities[product.id] || 1}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search terms to find what you're looking for.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
