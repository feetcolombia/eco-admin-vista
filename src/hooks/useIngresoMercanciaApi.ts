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

interface Bodega {
  bodega_id: number;
  bodega_source: string;
  bodega_nombre: string;
  bodega_altura: number;
  bodega_largo: number;
  bodega_profundidad: number;
  bodega_limite: number;
}

const BASE_URL = 'https://stg.feetcolombia.com/rest/V1';

export const useIngresoMercanciaApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const getIngresoMercancia = async (page: number, pageSize: number): Promise<SearchResponse> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/search?searchCriteria[currentPage]=${page}&searchCriteria[pageSize]=${pageSize}`,
        { headers }
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

  const getIngresoById = async (id: number): Promise<IngresoMercancia | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/search?searchCriteria[filter_groups][0][filters][0][field]=ingresomercancia_id&searchCriteria[filter_groups][0][filters][0][value]=${id}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar ingreso');
      
      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar o ingreso. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getBodegas = async (source: string): Promise<Bodega[]> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetbodega-mercancia/bodega/${source}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar bodegas');
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar as bodegas. Tente novamente.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getIngresoMercancia,
    getIngresoById,
    getBodegas,
  };
}; 