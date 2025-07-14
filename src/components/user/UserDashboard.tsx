
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, LogOut, Package, ShoppingCart, History } from "lucide-react";
import { ProductCatalog } from "./ProductCatalog";
import { ShoppingCartComponent } from "./ShoppingCartComponent";
import { OrderHistory } from "./OrderHistory";
import { Header } from "@/components/ui/Header";

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  specifications?: string;
}

interface UserDashboardProps {
  user: { role: string; name: string };
  onLogout: () => void;
}

export const UserDashboard = ({ user, onLogout }: UserDashboardProps) => {
  const [activeTab, setActiveTab] = useState("catalog");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: any, quantity: number) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleOrderPlaced = () => {
    // Switch to order history tab after successful order
    setActiveTab("orders");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={onLogout}
        navLinks={[
          { label: "Catalog", onClick: () => setActiveTab("catalog") },
          { label: `Cart (${cartItems.length})`, onClick: () => setActiveTab("cart") },
          { label: "Order History", onClick: () => setActiveTab("orders") },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Catalog
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Shopping Cart ({cartItems.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <ProductCatalog onAddToCart={addToCart} />
          </TabsContent>

          <TabsContent value="cart">
            <ShoppingCartComponent 
              cartItems={cartItems}
              onRemoveFromCart={removeFromCart}
              onUpdateQuantity={updateCartQuantity}
              onOrderPlaced={handleOrderPlaced}
            />
          </TabsContent>

          <TabsContent value="orders">
            <OrderHistory agencyName={user.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
