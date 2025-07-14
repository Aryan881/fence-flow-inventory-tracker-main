import React from "react";
import { Button } from "@/components/ui/button";
import { Building2, LogOut } from "lucide-react";

interface HeaderProps {
  user: { name: string; role: string };
  onLogout: () => void;
  navLinks?: { label: string; onClick: () => void }[];
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, navLinks }) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ADRDE Inventory</h1>
            <p className="text-sm text-gray-600">{user.role === "admin" ? "Admin" : "Agency"} &mdash; {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {navLinks && navLinks.length > 0 && (
            <nav className="flex gap-2">
              {navLinks.map((link, idx) => (
                <Button key={idx} variant="ghost" onClick={link.onClick} className="text-gray-700">
                  {link.label}
                </Button>
              ))}
            </nav>
          )}
          <Button onClick={onLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}; 