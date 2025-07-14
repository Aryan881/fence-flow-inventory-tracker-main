
import { useState, useContext } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserDashboard } from "@/components/user/UserDashboard";
import { AuthContext } from "@/context/AuthContext";

export type UserRole = "admin" | "agency" | null;

const Index = () => {
  const [user, setUser] = useState<{ role: UserRole; name: string } | null>(null);
  const { logout: authLogout } = useContext(AuthContext);

  const handleLogin = (role: UserRole, name: string) => {
    setUser({ role, name });
  };

  const handleLogout = () => {
    setUser(null);
    authLogout(); // Clear token from localStorage and AuthContext
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.role === "admin" ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <UserDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
