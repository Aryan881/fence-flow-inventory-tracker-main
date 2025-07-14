
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Shield } from "lucide-react";
import { UserRole } from "@/pages/Index";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "sonner";

interface LoginFormProps {
  onLogin: (role: UserRole, name: string) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [adminForm, setAdminForm] = useState({ username: "", password: "" });
  const [agencyForm, setAgencyForm] = useState({ username: "", password: "" });
  const { setToken } = useContext(AuthContext);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminForm.username && adminForm.password) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: adminForm.username, password: adminForm.password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          onLogin("admin", adminForm.username);
        } else {
          toast.error(data.error || "Login failed");
        }
      } catch (err) {
        toast.error("Network error");
      }
    }
  };

  const handleAgencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agencyForm.username && agencyForm.password) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: agencyForm.username, password: agencyForm.password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          onLogin("agency", agencyForm.username);
        } else {
          toast.error(data.error || "Login failed");
        }
      } catch (err) {
        toast.error("Network error");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-blue-800 mb-2">
            <Building2 className="h-8 w-8" />
            ADRDE Inventory
          </div>
          <p className="text-gray-600">Defence Management System</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Login to Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="agency" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="agency" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Agency
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="agency" className="mt-6">
                <form onSubmit={handleAgencyLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="agencyUsername">Username</Label>
                    <Input
                      id="agencyUsername"
                      type="text"
                      placeholder="Enter your username"
                      value={agencyForm.username}
                      onChange={(e) => setAgencyForm({ ...agencyForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="agencyPassword">Password</Label>
                    <Input
                      id="agencyPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={agencyForm.password}
                      onChange={(e) => setAgencyForm({ ...agencyForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Login as Agency
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    Demo: username: agency1, password: agency123
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-6">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter admin username"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminPassword">Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Enter admin password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Login as Admin
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    Demo: username: admin, password: admin123
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
