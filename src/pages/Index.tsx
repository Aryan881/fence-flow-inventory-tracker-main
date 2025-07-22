
import { useState, useContext } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserDashboard } from "@/components/user/UserDashboard";
import { AuthContext } from "@/context/AuthContext";
import { RegisterForm } from "../components/auth/RegisterForm";

export type UserRole = "admin" | "agency" | null;

const Index = () => {
  const [user, setUser] = useState<{ role: UserRole; name: string } | null>(null);
  const { logout: authLogout } = useContext(AuthContext);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = (role: UserRole, name: string) => {
    setUser({ role, name });
  };

  const handleLogout = () => {
    setUser(null);
    authLogout(); // Clear token from localStorage and AuthContext
  };

  if (!user) {
    return showRegister ? (
      <div>
        <RegisterForm onRegistered={() => setShowRegister(false)} />
        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">Already have an account? </span>
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => setShowRegister(false)}
          >
            Login here
          </button>
        </div>
      </div>
    ) : (
      <LoginForm onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />
    );
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
