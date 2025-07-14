import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

// Use relative URL to work with Vite proxy
const API_BASE_URL = "/api";

export const useApi = () => {
  const { token } = useContext(AuthContext);

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    return fetch(url, { ...options, headers });
  };

  return { apiFetch };
}; 