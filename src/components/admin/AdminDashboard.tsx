
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, LogOut, Package, ShoppingCart, Users, Activity } from "lucide-react";
import { ProjectsList } from "./ProjectsList";
import { ProductsManager } from "./ProductsManager";
import { OrdersManager } from "./OrdersManager";
import { Header } from "@/components/ui/Header";

interface AdminDashboardProps {
  user: { role: string; name: string };
  onLogout: () => void;
}

export const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in real app this would come from database
  const stats = {
    totalProjects: 12,
    completedProjects: 8,
    ongoingProjects: 4,
    totalProducts: 156,
    readyProducts: 89,
    inProductionProducts: 45,
    underMaintenanceProducts: 22,
    totalOrders: 23,
    pendingOrders: 5
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={onLogout}
        navLinks={[
          { label: "Overview", onClick: () => setActiveTab("overview") },
          { label: "Projects", onClick: () => setActiveTab("projects") },
          { label: "Products", onClick: () => setActiveTab("products") },
          { label: "Orders", onClick: () => setActiveTab("orders") },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalProjects}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{stats.completedProjects} Complete</Badge>
                    <Badge variant="outline">{stats.ongoingProjects} Ongoing</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.totalProducts}</div>
                  <div className="text-sm text-gray-500 mt-1">{stats.readyProducts} Ready to Ship</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.totalOrders}</div>
                  <div className="text-sm text-gray-500 mt-1">{stats.pendingOrders} Pending</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Online</div>
                  <div className="text-sm text-gray-500 mt-1">All systems operational</div>
                </CardContent>
              </Card>
            </div>

            {/* Project Progress Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Project Completion Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Project Completion</span>
                      <span>{Math.round((stats.completedProjects / stats.totalProjects) * 100)}%</span>
                    </div>
                    <Progress value={(stats.completedProjects / stats.totalProjects) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Product Inventory Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.readyProducts}</div>
                    <div className="text-sm text-green-700">Ready Products</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.inProductionProducts}</div>
                    <div className="text-sm text-blue-700">In Production</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.underMaintenanceProducts}</div>
                    <div className="text-sm text-orange-700">Under Maintenance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsList />
          </TabsContent>

          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
