
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, ShoppingCart, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  specifications?: string;
}

interface ShoppingCartComponentProps {
  cartItems: CartItem[];
  onRemoveFromCart: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onOrderPlaced?: () => void;
}

export const ShoppingCartComponent = ({ 
  cartItems, 
  onRemoveFromCart, 
  onUpdateQuantity,
  onOrderPlaced
}: ShoppingCartComponentProps) => {
  const { apiFetch } = useApi();
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!shippingAddress.trim()) {
      toast.error("Please provide a shipping address");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const orderData = {
        shipping_address: shippingAddress,
        notes: notes.trim() || undefined,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      const response = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Order ${result.order.order_number} submitted successfully!`);
        
        // Clear cart after successful order
        cartItems.forEach(item => onRemoveFromCart(item.id));
        setShippingAddress("");
        setNotes("");
        
        // Notify parent component
        if (onOrderPlaced) {
          onOrderPlaced();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to place order");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveFromCart(productId);
    } else {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600">Browse our product catalog to add items to your cart.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
        <div className="text-sm text-gray-600">{cartItems.length} items</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">SKU: {item.sku}</p>
                    {item.specifications && (
                      <p className="text-sm text-gray-600">{item.specifications}</p>
                    )}
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      ${item.price} per unit
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Qty:</span>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(item.price * item.quantity).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${item.price} × {item.quantity}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shipping-address">Shipping Address *</Label>
                <Textarea
                  id="shipping-address"
                  placeholder="Enter your complete shipping address..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes for this order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
              
              <Button 
                onClick={handleCheckout}
                disabled={isProcessing || !shippingAddress.trim()}
                className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Place Order
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                By placing this order, you agree to our terms and conditions.
                You will receive an order confirmation email.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
