
import { toast } from "@/hooks/use-toast";

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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

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
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    try {
      // Simulação de chamada de API
      await mockDelay();
      
      if (credentials.email === "admin@exemplo.com" && credentials.password === "senha123") {
        const user: User = {
          id: "1",
          name: "Admin",
          email: "admin@exemplo.com",
          role: "admin",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
        };
        
        // Salva o token no localStorage (isso seria feito com um token real JWT)
        localStorage.setItem("auth_token", "mock_jwt_token");
        localStorage.setItem("user", JSON.stringify(user));
        
        return {
          success: true,
          data: user,
          message: "Login realizado com sucesso"
        };
      }
      
      throw new Error("Credenciais inválidas");
    } catch (error: any) {
      handleApiError(error);
      throw error;
    }
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    
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
