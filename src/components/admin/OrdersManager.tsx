
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Package, DollarSign } from "lucide-react";

export const OrdersManager = () => {
  // Mock orders data
  const orders = [
    {
      id: "ORD-001",
      agencyName: "Defense Agency Alpha",
      orderDate: "2024-06-20",
      status: "pending",
      items: [
        { name: "Steel Security Fence Panel", quantity: 50, price: 150 },
        { name: "Concrete Fence Posts", quantity: 25, price: 80 }
      ],
      totalAmount: 9500,
      deliveryDate: "2024-07-15"
    },
    {
      id: "ORD-002",
      agencyName: "Border Security Corp",
      orderDate: "2024-06-22",
      status: "processing",
      items: [
        { name: "Barbed Wire Coils", quantity: 30, price: 45 },
        { name: "Electronic Gate System", quantity: 2, price: 2500 }
      ],
      totalAmount: 6350,
      deliveryDate: "2024-07-20"
    },
    {
      id: "ORD-003",
      agencyName: "Military Installations Ltd",
      orderDate: "2024-06-25",
      status: "shipped",
      items: [
        { name: "Chain Link Fencing", quantity: 100, price: 25 }
      ],
      totalAmount: 2500,
      deliveryDate: "2024-07-01"
    },
    {
      id: "ORD-004",
      agencyName: "Airport Security Services",
      orderDate: "2024-06-26",
      status: "delivered",
      items: [
        { name: "Steel Security Fence Panel", quantity: 75, price: 150 },
        { name: "Concrete Fence Posts", quantity: 40, price: 80 }
      ],
      totalAmount: 14450,
      deliveryDate: "2024-06-28"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "processing": return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "shipped": return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>;
      case "delivered": return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statusCounts = {
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="flex gap-2">
          <Badge variant="secondary">{orders.length} Total Orders</Badge>
          <Badge className="bg-yellow-100 text-yellow-800">{statusCounts.pending} Pending</Badge>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{statusCounts.processing}</div>
            <div className="text-sm text-blue-600">Processing</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{statusCounts.shipped}</div>
            <div className="text-sm text-purple-600">Shipped</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{statusCounts.delivered}</div>
            <div className="text-sm text-green-600">Delivered</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order {order.id}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {order.agencyName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {order.orderDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${order.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Order Items:</h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span>{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div>Qty: {item.quantity}</div>
                          <div className="text-gray-600">${item.price} each</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <div>
                    <div className="text-sm text-gray-600">Expected Delivery</div>
                    <div className="font-semibold">{order.deliveryDate}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    {order.status === "pending" && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Process Order
                      </Button>
                    )}
                    {order.status === "processing" && (
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Mark as Shipped
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
