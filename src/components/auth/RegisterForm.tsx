import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Shield } from "lucide-react";
import { toast } from "sonner";

interface RegisterFormProps {
  onRegistered: () => void;
}

export const RegisterForm = ({ onRegistered }: RegisterFormProps) => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "agency",
    name: "",
    agency_name: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Registration successful. You can now log in.");
        onRegistered();
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
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
            <CardTitle className="text-center">Register New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="agency">Agency</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              {form.role === "agency" && (
                <div>
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <Input
                    id="agency_name"
                    name="agency_name"
                    type="text"
                    placeholder="Enter agency name"
                    value={form.agency_name}
                    onChange={handleChange}
                  />
                </div>
              )}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 