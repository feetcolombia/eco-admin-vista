import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface IngresoMercancia {
  ingresomercancia_id: number;
  source: string;
  creador: number;
  fecha: string;
  consecutivo: string;
  estado: string;
  nombre_responsable: string;
}

interface SearchResponse {
  items: IngresoMercancia[];
  total_count: number;
}

const BASE_URL = 'https://stg.feetcolombia.com/rest/V1';

export const useIngresoMercanciaApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  const getIngresoMercancia = async (page: number, pageSize: number): Promise<SearchResponse> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/search?searchCriteria[currentPage]=${page}&searchCriteria[pageSize]=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar ingresos');
      
      const data = await response.json();
      return {
        items: data.items || [],
        total_count: data.total_count || 0
      };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar os ingresos. Tente novamente.",
        variant: "destructive",
      });
      return { items: [], total_count: 0 };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getIngresoMercancia,
  };
}; 