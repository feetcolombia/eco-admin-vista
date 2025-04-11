import { useToast } from "@/components/ui/use-toast";

export interface ApiError {
  message: string;
  status: number;
}

export const useApiError = () => {
  const { toast } = useToast();

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

  return { handleApiError };
}; 