import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SalidaMercancia {
  salidamercancia_id: number;
  source: string;
  creador: number;
  fecha: string;
  consecutivo: string;
  estado: string;
  descripcion: string;
  nombre_responsable: string;
}

interface SearchResponse {
  items: SalidaMercancia[];
  total_count: number;
}

interface Source {
  source_code: string;
  name: string;
  enabled: boolean;
  description?: string;
  extension_attributes: {
    is_pickup_location_active: boolean;
    frontend_name: string;
  };
}

interface SourcesResponse {
  items: Source[];
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

export const useSalidaMercanciaApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const getSources = async (): Promise<Source[]> => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://stg.feetcolombia.com/rest/all/V1/inventory/sources',
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar origens');
      
      const data: SourcesResponse = await response.json();
      return data.items || [];
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar as origens. Tente novamente.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createSalidaMercancia = async (data: {
    source: string;
    creador: number;
    fecha: string;
    nombre_responsable: string;
    descripcion: string;
  }): Promise<SalidaMercancia | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            salidaMercancia: data
          })
        }
      );
      
      if (!response.ok) throw new Error('Erro ao criar saída');
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar a saída. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSalidaMercancia = async (page: number, pageSize: number): Promise<SearchResponse> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia/search?searchCriteria[currentPage]=${page}&searchCriteria[pageSize]=${pageSize}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar saídas');
      
      const data = await response.json();
      return {
        items: data.items || [],
        total_count: data.total_count || 0
      };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar as saídas. Tente novamente.",
        variant: "destructive",
      });
      return { items: [], total_count: 0 };
    } finally {
      setLoading(false);
    }
  };

  const getSalidaById = async (id: number): Promise<SalidaMercancia | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia/${id}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar saída');
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar a saída. Tente novamente.",
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
    getSources,
    createSalidaMercancia,
    getSalidaMercancia,
    getSalidaById,
    getBodegas,
  };
}; 