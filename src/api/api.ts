import { toast } from "@/hooks/use-toast";
import axios, { AxiosRequestConfig } from 'axios';

// Estender a interface AxiosRequestConfig para incluir a propriedade _retry
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Callback para logout quando token expirar
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Tipos para a API
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  inventory: number;
  category: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: Product[];
}

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Armazenar credenciais de forma segura (cifradas em base64 simples para este exemplo)
// Em produção, considere usar uma solução mais segura
const saveCredentials = (credentials: LoginCredentials) => {
  const encoded = btoa(JSON.stringify(credentials));
  sessionStorage.setItem('auth_credentials', encoded);
};

const getStoredCredentials = (): LoginCredentials | null => {
  const encoded = sessionStorage.getItem('auth_credentials');
  if (!encoded) return null;
  
  try {
    return JSON.parse(atob(encoded));
  } catch (e) {
    console.error('Erro ao recuperar credenciais', e);
    return null;
  }
};

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com respostas e reautenticar quando necessário
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("Interceptor acionado. Status:", error.response?.status, "URL:", error.config?.url);
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    // Verifica se o erro é de autenticação (401) e não é uma tentativa de login ou já uma tentativa de retry
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/integration/admin/token')) {
      
      originalRequest._retry = true;
      
      // Notificar o usuário que estamos reautenticando
      toast({
        title: "Sessão expirada",
        description: "Reconectando automaticamente...",
        variant: "default",
      });
      
      // Tenta reautenticar
      const credentials = getStoredCredentials();
      console.log("Credenciais recuperadas:", credentials);
      if (credentials) {
        try {
          console.log('Token expirado. Tentando reautenticar...');
          const response = await api.post('/rest/V1/integration/admin/token', {
            username: credentials.email,
            password: credentials.password
          });
          
          const newToken = response.data;
          console.log("Novo token recebido:", newToken);
          localStorage.setItem('auth_token', newToken);
          
          // Notifica o usuário sobre o sucesso
          toast({
            title: "Reconectado",
            description: "Sua sessão foi restaurada com sucesso",
            variant: "default",
          });
          
          // Atualiza o token na requisição original e tenta novamente
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log("Headers da requisição original após atualização:", originalRequest.headers);
          console.log("Refazendo requisição original com novo token...");
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Falha na reautenticação:', refreshError);
          
          // Limpar credenciais inválidas
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_credentials');
          
          // Notifica o usuário sobre a falha
          toast({
            title: "Sessão expirada",
            description: "Suas credenciais expiraram. Por favor, faça login novamente.",
            variant: "destructive",
          });
          
          // Use o callback do AuthContext se disponível, caso contrário use window.location
          if (logoutCallback) {
            logoutCallback();
          } else {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // Limpar dados de autenticação
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_credentials');
        
        // Notifica o usuário que é necessário fazer login novamente
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente",
          variant: "destructive",
        });
        
        // Use o callback do AuthContext se disponível, caso contrário use window.location
        if (logoutCallback) {
          logoutCallback();
        } else {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Função para lidar com erros de API de forma consistente
const handleApiError = (error: any): ApiError => {
  console.error("API Error:", error);
  
  const defaultErrorMessage = "Ocorreu um erro. Por favor, tente novamente mais tarde.";
  
  let apiError: ApiError = {
    message: defaultErrorMessage,
    status: 500
  };
  
  if (error.response) {
    // Erro de resposta do servidor
    apiError = {
      message: error.response.data?.message || defaultErrorMessage,
      status: error.response.status
    };
  } else if (error.request) {
    // Erro de requisição (sem resposta)
    apiError = {
      message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
      status: 0
    };
  }
  
  toast({
    title: "Erro",
    description: apiError.message,
    variant: "destructive"
  });
  
  return apiError;
};

// Funções de API mockadas para desenvolvimento
const mockDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// API de Autenticação
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<string>> => {
    try {
      const response = await api.post('/rest/V1/integration/admin/token', {
        username: credentials.email,
        password: credentials.password
      });

      const token = response.data;
      
      // Salva o token no localStorage
      localStorage.setItem("auth_token", token);
      
      // Salva as credenciais de forma segura para reautenticação futura
      saveCredentials(credentials);
      
      return {
        success: true,
        data: token,
        message: "Login realizado com sucesso"
      };
    } catch (error: any) {
      handleApiError(error);
      throw error;
    }
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("auth_credentials");
    
    return {
      success: true,
      data: null,
      message: "Logout realizado com sucesso"
    };
  },
  
  getCurrentUser: async (): Promise<ApiResponse<User | null>> => {
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("auth_token");
      
      if (!token || !userStr) {
        return {
          success: false,
          data: null,
          message: "Usuário não autenticado"
        };
      }
      
      return {
        success: true,
        data: JSON.parse(userStr),
        message: "Usuário recuperado com sucesso"
      };
    } catch (error: any) {
      handleApiError(error);
      throw error;
    }
  }
};

// API de Produtos
export const productApi = {
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    try {
      await mockDelay();
      
      // Dados mockados
      const products: Product[] = [
        {
          id: "1",
          name: "Camiseta",
          price: 29.99,
          description: "Camiseta de algodão premium",
          inventory: 100,
          category: "Roupas",
          imageUrl: "https://via.placeholder.com/150",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "2",
          name: "Tênis",
          price: 99.99,
          description: "Tênis esportivo",
          inventory: 50,
          category: "Calçados",
          imageUrl: "https://via.placeholder.com/150",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "3",
          name: "Mochila",
          price: 59.99,
          description: "Mochila resistente à água",
          inventory: 30,
          category: "Acessórios",
          imageUrl: "https://via.placeholder.com/150",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return {
        success: true,
        data: products,
        message: "Produtos recuperados com sucesso"
      };
    } catch (error: any) {
      handleApiError(error);
      throw error;
    }
  }
};

// API de Pedidos
export const orderApi = {
  getOrders: async (): Promise<ApiResponse<Order[]>> => {
    try {
      await mockDelay();
      
      // Dados mockados
      const orders: Order[] = [
        {
          id: "1",
          customerId: "1",
          customerName: "João Silva",
          items: [
            {
              productId: "1",
              productName: "Camiseta",
              quantity: 2,
              price: 29.99
            }
          ],
          total: 59.98,
          status: "delivered",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "2",
          customerId: "2",
          customerName: "Maria Santos",
          items: [
            {
              productId: "2",
              productName: "Tênis",
              quantity: 1,
              price: 99.99
            }
          ],
          total: 99.99,
          status: "shipped",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return {
        success: true,
        data: orders,
        message: "Pedidos recuperados com sucesso"
      };
    } catch (error: any) {
      handleApiError(error);
      throw error;
    }
  }
};

// API de Dashboard
export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      await mockDelay();
      
      // Dados mockados
      const stats: DashboardStats = {
        totalSales: 15689.45,
        totalOrders: 234,
        totalCustomers: 158,
        totalProducts: 45,
        recentOrders: [
          {
            id: "1",
            customerId: "1",
            customerName: "João Silva",
            items: [
              {
                productId: "1",
                productName: "Camiseta",
                quantity: 2,
                price: 29.99
              }
            ],
            total: 59.98,
            status: "delivered",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        topProducts: [
          {
            id: "1",
            name: "Camiseta",
            price: 29.99,
            description: "Camiseta de algodão premium",
            inventory: 100,
            category: "Roupas",
            imageUrl: "https://via.placeholder.com/150",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      };
      
      return {
        success: true,
        data: stats,
        message: "Estatísticas recuperadas com sucesso"
      };
    } catch (error: any) {
      handleApiError(error);
      throw error;
    }
  }
};

export { api };
