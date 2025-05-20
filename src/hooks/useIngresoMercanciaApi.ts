import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface IngresoMercancia {
  ingresomercancia_id: string;
  source: string;
  creador: string;
  fecha: string;
  consecutivo: string;
  estado: string;
  nombre_responsable: string;
  productos: IngresoMercanciaProducto[];
}

interface SearchResponse {
  items: IngresoMercancia[];
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
  bodega_descripcion: string;
  bodega_altura: number;
  bodega_largo: number;
  bodega_profundidad: number;
  bodega_limite: number;
}

interface BarcodeResponse {
  id: string;
  barcode: string;
  qty: string;
  product_id: string;
  product_sku: string;
  supplier_id: string;
  supplier_code: string | null;
  purchased_id: string;
  purchased_time: string | null;
  history_id: string;
  created_at: string;
  product_image: string;
  product_name: string;
  product_price: string;
  product_weight: string;
  product_color: string;
  product_stock: string;
  product_status: string;
}

interface IngresoMercanciaProducto {
  ingreso_mercancia_producto_id: string;
  ingreso_mercancia_id: string;
  producto: string;
  sku: string;
  cantidad: string;
  bodega_id: string;
  bodega_nombre: string;
}

interface IngresoMercanciaResponse {
  items: IngresoMercancia[];
  search_criteria: {
    filter_groups: Array<{
      filters: Array<{
        field: string;
        value: string;
        condition_type: string;
      }>;
    }>;
  };
  total_count: number;
}

interface IngresoMercanciaProductoPayload {
  ingreso_mercancia_id: string;
  sku: string;
  cantidad: number;
  bodega_id: string;
}

interface BodegaPayload {
  bodega: {
    bodega_source: string;
    bodega_nombre: string;
    bodega_descripcion: string;
    bodega_altura: number;
    bodega_largo: number;
    bodega_profundidad: number;
    bodega_limite: number;
  }
}

interface UpdateBodegaPayload {
  bodega: {
    bodega_nombre?: string;
    bodega_descripcion?: string;
    bodega_altura?: number;
    bodega_largo?: number;
    bodega_profundidad?: number;
    bodega_limite?: number;
  }
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

  const createIngresoMercancia = async (data: {
    source: string;
    creador: number;
    fecha: string;
    nombre_responsable: string;
  }): Promise<IngresoMercancia | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ingresoMercancia: {
              source: data.source,
              creador: data.creador,
              fecha: data.fecha,
              nombre_responsable: data.nombre_responsable
            }
          })
        }
      );
      
      if (!response.ok) throw new Error('Erro ao criar ingresso');
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar o ingresso. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getIngresoMercancia = async (page: number, pageSize: number): Promise<SearchResponse> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/search?searchCriteria[currentPage]=${page}&searchCriteria[pageSize]=${pageSize}&searchCriteria[sortOrders][0][field]=fecha&searchCriteria[sortOrders][0][direction]=DESC`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar ingressos');
      
      const data = await response.json();
      return {
        items: data.items || [],
        total_count: data.total_count || 0
      };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar os ingressos. Tente novamente.",
        variant: "destructive",
      });
      return { items: [], total_count: 0 };
    } finally {
      setLoading(false);
    }
  };

  const getIngresoById = async (id: number): Promise<IngresoMercanciaResponse | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/search?searchCriteria[filter_groups][0][filters][0][field]=ingresomercancia_id&searchCriteria[filter_groups][0][filters][0][value]=${id}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar ingresso');
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar o ingresso. Tente novamente.",
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

  const getBarcodeData = async (barcode: string): Promise<BarcodeResponse | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/barcodesuccess/getdata?barcode=${barcode}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar dados do código de barras');
      
      const [data] = await response.json();
      return data || null;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar dados do código de barras. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveIngresoMercanciaProductos = async (productos: IngresoMercanciaProductoPayload[]): Promise<boolean> => {
    setLoading(true);
    try {
      const payload = {
        ingresoMercanciaProductos: productos
      };
      console.log('Payload enviado:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/producto`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro da API:', errorData);
        throw new Error('Erro ao salvar produtos');
      }
      
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar os produtos. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmarIngresoMercancia = async (ingresoMercanciaId: string | number, sourceCode: string): Promise<boolean> => {
    setLoading(true);
    try {
      const payload = {
        ingresoMercanciaId: Number(ingresoMercanciaId),
        sourceCode
      };
      
      console.log('Payload enviado:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(
        `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/productos/inventory`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro da API:', errorData);
        throw new Error('Erro ao confirmar ingresso');
      }
      
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar o ingresso. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  async function validateCsv(payload: {
    csv_file: string;
    source: string;
    fecha: string;
    nombre_responsable: string;
    descripcion: string;
    creador: number;
  }): Promise<{ message: string; error: boolean }[]> {
    const response = await fetch(
      `${BASE_URL}/feetmercancia-ingreso/ingresomercancia/csv`,
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

  const createBodega = async (data: BodegaPayload): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetbodega-mercancia/bodega`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro da API:', errorData);
        throw new Error('Erro ao criar bodega');
      }
      
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar a bodega. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getBodegaById = async (id: number): Promise<Bodega | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetbodega-mercancia/bodega/id/${id}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar bodega');
      
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar os detalhes da bodega. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBodega = async (id: number, data: UpdateBodegaPayload): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/feetbodega-mercancia/bodega/${id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro da API:', errorData);
        throw new Error('Erro ao atualizar bodega');
      }
      
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar a bodega. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getSources,
    createIngresoMercancia,
    getIngresoMercancia,
    getIngresoById,
    getBodegas,
    getBarcodeData,
    saveIngresoMercanciaProductos,
    confirmarIngresoMercancia,
    createBodega,
    getBodegaById,
    updateBodega,
    validateCsv,
  };
}; 