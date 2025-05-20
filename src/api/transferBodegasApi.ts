import { apiClient, getAuthHeaders } from './apiConfig';
import { Bodega , TransferenciaBodega} from './types/transferTypes'; 


interface Produto {
    transferencia_productos_id: string;
    cantidad_transferir: string;
    cantidad_disponible: string;
    observacion: string;
    created_at: string;
    transferencia_bodega_id: string;
    id_producto: string;
    sku: string;
  }

  export interface ProductoUpdate {
    producto: string;
    cantidad_transferir: number;
    cantidad_existente: number;
    observacion?: string;
  }

export interface Source {
    source_code: string;
    name: string;
    enabled: boolean;
    description?: string;
    extension_attributes?: { frontend_name: string };
}

export interface BarcodeResponseItem {
    success: boolean;
    cantidad_disponible: string;
    id_producto: string;
    product_sku: string;
  }

interface InventorySourcesResponse {
    items: Source[];
    total_count: number;
} 
  

export interface TransferenciaBodegaResponse {
  source: string;
  fecha: string;
  nombre_responsable: string;
  consecutivo: string;
  codigo: string;
  transferenciamercancia_id: string;
  transferencia_id: string;
  descripcion: string;
  nombre_bodega_origen: string;
  nombre_bodega_destino: string;
  historico?: 's' | 'n';
  es_masiva: 's' | 'n';
  estado: 'c' | 'n' | 'f';
  creador: number;
  trasferencia_total: number;
  created_at?: string;
  updated_at?: string;
  productos: Produto[];
}

export interface ListPayload {
    items: TransferenciaBodega[];
    total_count: number;
    current_page: number;
    page_size: number;
  }

export const transferBodegasApi = {
  /**
   * Crea o actualiza una transferencia de bodega con productos
   */
  updateTransferencia: async (payload: {
    data: {
      transferencia_id: number;
      soruce: string;
      responsable: string;
      nombre_responsable: string;
      id_bodega_origen: number;
      id_bodega_destino: number;
      descripcion: string;
      estado: string;
    };
  }): Promise<TransferenciaBodegaResponse[]> => {
    const resp = await apiClient.post<TransferenciaBodegaResponse[]>(
      '/rest/V1/transferenciabodegas',
      payload,
      { headers: getAuthHeaders() }
    );
    return resp.data;
  },

  getOrigens: async (): Promise<Source[]> => {
    const resp = await apiClient.get<InventorySourcesResponse>(
      '/rest/all/V1/inventory/sources',
      { headers: getAuthHeaders() }
    );
    return resp.data.items;
  },

  getBodegasMercancia: async (source: string): Promise<Bodega[]> => {
    const resp = await apiClient.get<Bodega[]>(
      `/rest/V1/feetbodega-mercancia/bodega/source/${encodeURIComponent(source)}`,
      { headers: getAuthHeaders() }
    );
    return resp.data;
  },

    getTransferencia: async (id: string, token: string): Promise<TransferenciaBodegaResponse[]> => {
        const resp = await apiClient.get<TransferenciaBodegaResponse[]>(
            `/rest/V1/transferenciabodegas/${encodeURIComponent(id)}`,
            { headers: getAuthHeaders() }
        );
        return resp.data;
    },

    scanBarcode: async (
        barcode: string,
        idBodegaOrigen: number | string,
        idBodegaDestino: number | string,
        source: string,
        cantidadTransferir: number
        ): Promise<BarcodeResponseItem[]> => {
        const resp = await apiClient.post<BarcodeResponseItem[]>(
            '/rest/V1/transferenciabarcode',
            { barcode, idBodegaOrigen, idBodegaDestino, source, cantidadTransferir },
            { headers: getAuthHeaders() }
        );
        return resp.data;
    },

    updateTransferenciaPut: async (payload: {
        data: {
          transferencia_id: number;
          soruce: string;
          responsable: string;
          nombre_responsable: string;
          id_bodega_origen: number;
          id_bodega_destino: number;
          descripcion: string;
          estado: string;
          productos: ProductoUpdate[];
        };
      }): Promise<[boolean, number]> => {
        const resp = await apiClient.put<[boolean, number]>(
          '/rest/V1/transferenciabodegas',
          payload,
          { headers: getAuthHeaders() }
        );
        return resp.data;
      },

    list: async (
        currentPage: number,
        pageSize: number
    ): Promise<[boolean, ListPayload]> => {
        const resp = await apiClient.get<
        [boolean, ListPayload]
        >(
        `/rest/V1/transferenciabodegas/list?currentPage=${currentPage}&pageSize=${pageSize}&sortOrders[0][field]=transferencia_bodega_id&sortOrders[0][direction]=DESC`,
        { headers: getAuthHeaders() }
        );
        return resp.data;
    },

    getById: async (
        id: string,
        token: string
        ): Promise<[boolean, TransferenciaBodegaResponse]> => {
        const resp = await apiClient.get<[boolean, TransferenciaBodegaResponse]>(
            `/rest/V1/transferenciabodegas/${encodeURIComponent(id)}`,
            { headers: getAuthHeaders() }
        );
        return resp.data;
    },
};