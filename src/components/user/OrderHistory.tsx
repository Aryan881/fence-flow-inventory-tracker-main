
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, DollarSign, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  shipping_address?: string;
  notes?: string;
  items: OrderItem[];
}

interface OrderHistoryProps {
  agencyName: string;
}

export const OrderHistory = ({ agencyName }: OrderHistoryProps) => {
  const { apiFetch } = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved": return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case "processing": return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "shipped": return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>;
      case "delivered": return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case "cancelled": return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Package className="h-4 w-4 text-yellow-600" />;
      case "approved": return <Package className="h-4 w-4 text-blue-600" />;
      case "processing": return <Package className="h-4 w-4 text-blue-600" />;
      case "shipped": return <Truck className="h-4 w-4 text-purple-600" />;
      case "delivered": return <Package className="h-4 w-4 text-green-600" />;
      case "cancelled": return <Package className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
        <Badge variant="secondary">{orders.length} Total Orders</Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Your order history will appear here once you place your first order.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      Order {order.order_number}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Ordered: {formatDate(order.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${order.total_amount.toLocaleString()}
                      </div>
                      {order.status === "shipped" && (
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          In Transit
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Order Items:</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{item.product_name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${item.total_price.toLocaleString()}</div>
                            <div className="text-gray-600">
                              {item.quantity} × ${item.unit_price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {order.notes && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div>
                      <div className="text-sm text-gray-600">
                        Last Updated
                      </div>
                      <div className="font-semibold">{formatDate(order.updated_at)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {order.status === "delivered" && (
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          Track Package
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
