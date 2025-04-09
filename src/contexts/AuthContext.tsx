
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginCredentials, authApi } from "../api/api";
import { useToast } from "@/hooks/use-toast";

interface User {
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          // Mock user data - in a real app, this would come from an API call
          setCurrentUser({
            name: "Carolina Silva",
            role: "Administrador",
            avatar: "https://i.pravatar.cc/150?img=57",
          });
        }
      } catch (error) {
        console.error("Failed to initialize authentication", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        setToken(response.data);
        // Mock user data - in a real app, this would come from an API call
        setCurrentUser({
          name: "Carolina Silva",
          role: "Administrador",
          avatar: "https://i.pravatar.cc/150?img=57",
        });
        navigate("/dashboard");
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo ao painel administrativo!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro de login",
        description: error.message || "Falha na autenticação",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('auth_token');
      setToken(null);
      setCurrentUser(null);
      navigate("/login");
      toast({
        title: "Logout",
        description: "Você saiu com sucesso.",
      });
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
