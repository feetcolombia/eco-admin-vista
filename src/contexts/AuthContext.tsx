import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginCredentials, authApi } from "../api/api";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Tempo de inatividade em milissegundos (1 hora)
  const INACTIVITY_TIMEOUT = 60 * 60 * 1000;
  
  // Definir logout antes do useEffect que o utiliza
  const logout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('last_activity');
      sessionStorage.removeItem('auth_credentials');
      setToken(null);
      navigate("/login");
      toast({
        title: "Logout",
        description: "Você saiu com sucesso.",
      });
    } catch (error) {
      console.error("Logout error", error);
    }
  };
  
  useEffect(() => {
    // Função para verificar quando foi a última atividade do usuário
    const checkUserActivity = () => {
      const lastActivity = localStorage.getItem('last_activity');
      
      if (lastActivity && token) {
        const now = new Date().getTime();
        const lastActivityTime = parseInt(lastActivity, 10);
        
        // Se passou mais tempo que o timeout desde a última atividade
        if (now - lastActivityTime > INACTIVITY_TIMEOUT) {
          console.log('Sessão expirada por inatividade');
          logout();
        }
      }
      
      // Atualiza o timestamp da última atividade
      localStorage.setItem('last_activity', new Date().getTime().toString());
    };
    
    // Verificar atividade a cada 5 minutos
    const activityInterval = setInterval(checkUserActivity, 5 * 60 * 1000);
    
    // Atualizar timestamp de atividade em interações do usuário
    const updateActivity = () => {
      localStorage.setItem('last_activity', new Date().getTime().toString());
    };
    
    // Adicionar listeners para detectar atividade do usuário
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    // Verificar imediatamente ao montar o componente
    checkUserActivity();
    
    return () => {
      clearInterval(activityInterval);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [token, navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          // Inicializa o timestamp de última atividade ao carregar a página
          localStorage.setItem('last_activity', new Date().getTime().toString());
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

  return (
    <AuthContext.Provider
      value={{
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
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
