import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

interface SalidaMercancia {
  salidamercancia_id: number;
  source: string;
  creador: number;
  fecha: string;
  consecutivo: string;
  estado: string;
  descripcion: string;
  nombre_responsable: string;
  productos?: {
    salida_mercancia_producto_id: string;
    salida_mercancia_id: string;
    producto: string;
    sku: string;
    cantidad: string;
    bodega_id: string;
    bodega_nombre: string;
  }[];
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

interface ProductQuantityResponse {
  inventory_quantity: number;
  product_sku: string;
  sku: string;
  transferencia_quantity: number;
  product_id: string | null;
  bodega_nombre: string;
  barcode: string;
}

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/rest/V1`;

interface CreateSalidaMercanciaPayload {
  salidaMercancia: {
    source: string;
    creador: number;
    fecha: string;
    nombre_responsable: string;
    descripcion: string;
  };
}

interface SaveProductsPayload {
  salidaMercanciaProductos: Array<{
    salida_mercancia_id: number;
    sku: string;
    cantidad: number;
    bodega_id: number;
  }>;
}

interface CompletarSalidaPayload {
  salidaMercanciaId: number;
  sourceCode: string;
}

export const useSalidaMercanciaApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const getSources = async (): Promise<Source[]> => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rest/all/V1/inventory/sources`,
        { headers }
      );
      return response.data.items || [];
    } catch (err) {
      setError('Erro ao buscar origens');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createSalidaMercancia = async (payload: CreateSalidaMercanciaPayload) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Error al crear salida de mercancía");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear salida de mercancía";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getSalidaMercancia = async (page: number, pageSize: number): Promise<SearchResponse> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia/search?searchCriteria[currentPage]=${page}&searchCriteria[pageSize]=${pageSize}&searchCriteria[sortOrders][0][field]=fecha&searchCriteria[sortOrders][0][direction]=DESC`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Error al buscar salidas');
      
      const data = await response.json();
      return {
        items: data.items || [],
        total_count: data.total_count || 0
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar las salidas. Intente nuevamente.",
        variant: "destructive",
      });
      return { items: [], total_count: 0 };
    } finally {
      setLoading(false);
    }
  };

  const getSalidaById = async (id: number): Promise<SalidaMercancia | null> => {
    if (!id || isNaN(id)) {
      console.error('ID inválido fornecido para getSalidaById:', id);
      toast({
        title: "Erro",
        description: "ID de saída inválido.",
        variant: "destructive",
      });
      return null;
    }
    
    setLoading(true);
    try {
      console.log('Buscando salida con ID:', id);
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia/${id}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Error al buscar salida mercancía');
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Error al buscar la salida mercancía, intenta nuevamente.",
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
        `${BASE_URL}/feetbodega-mercancia/bodega/source/${source}`,
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

  const getProductQuantity = async (barcode: string, bodegaId: number, source: string): Promise<ProductQuantityResponse> => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/feetmercancia-salida/productquantity`,
        {
          headers,
          params: {
            source,
            bodegaId,
            barcode
          }
        }
      );
      
      const data = JSON.parse(response.data); // A resposta vem como string JSON
      
      // Se transferencia_quantity for 0, significa que o produto não está na posição
      if (data.transferencia_quantity === 0) {
        toast({
          title: "Atenção",
          description: `Produto não encontrado na posição ${data.bodega_nombre}`,
          variant: "destructive",
        });
        throw new Error('Produto não encontrado na posição');
      }
      
      return data;
    } catch (err) {
      if (err.message === 'Produto não encontrado na posição') {
        throw err;
      }
      toast({
        title: "Erro",
        description: "Erro ao buscar produto",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const exportSalidaExcel = async (salidaId: number): Promise<any[]> => {
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia/excel/${salidaId}`,
        {
          method: "GET",
          headers,
        }
      );
      if (!response.ok) {
        throw new Error("Error al exportar Excel");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar Excel",
        variant: "destructive",
      });
      throw error;
    }
  };

  const saveProducts = async (payload: SaveProductsPayload) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/feetmercancia-salida/salidamercancia/producto`,
        payload,
        { headers }
      );
      
      toast({
        title: "Exito",
        description: "Produtos guardados correctamente",
      });
      
      return response.data;
    } catch (err) {
      toast({
        title: "Erro",
        description: "Error al guardar los productos",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completarSalida = async (payload: CompletarSalidaPayload) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-salida/salidamercancia/productos/inventory`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Error al completar salida de mercancía");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al completar salida de mercancía";
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  async function validateSalidaCSV(payload: {
    csv_file: string;
    source: string;
    nombre_responsable: string;
    fecha: string;
    descripcion: string;
    estado: string;
    creador: string;
  }): Promise<{ message: string; error: boolean }[]> {
    const response = await fetch(
      `${BASE_URL}/feetmercancia-salida/salidamercancia/csv`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: payload }),
      }
    );
    const result = await response.json();
    return result;
  };

  return {
    loading,
    error,
    getSources,
    createSalidaMercancia,
    getSalidaMercancia,
    getSalidaById,
    getBodegas,
    getProductQuantity,
    saveProducts,
    completarSalida,
    validateSalidaCSV,
    exportSalidaExcel,
  };
}; 