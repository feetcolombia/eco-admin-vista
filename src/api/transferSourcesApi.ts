import { apiClient, getAuthHeaders } from './apiConfig';

export interface TransferSource {
  transferencia_source_id: number;
  source_origen: string;
  source_destino: string;
  descripcion: string;
  nombre_responsable: string;
  fecha: string;
  consecutivo: string;
  estado: 'c' | 'n' | 'f';
  creador: number;
  tipo: string;
  es_masiva: string;
  // otros campos...
}

export interface InventorySource {
    source_code: string;
    name: string;
  }

  export interface BarcodeLookupItem {
    product_id: string;
    product_sku: string;
    cantidad: string;
    cantidad_reservada: string;
    quantity_inventory: number;
    errors: string[];
  }

  export interface IngresoProcessResult {
    sku: string;
    ingreso_cantidad: number;
    inventory_updated: number;
    datos_final_updated: number;
  }
  
  export interface SalidaProcessResult {
    sku: string;
    salida_cantidad: number;
    inventory_updated: number;
    datos_final_updated: number;
  }

export const transferSourcesApi = {
  getAll: async (): Promise<TransferSource[]> => {
    const resp = await apiClient.get<TransferSource[]>(
      '/rest/V1/transferencia-source/all/',
      { headers: getAuthHeaders() }
    );
    return resp.data;
  },
 delete: async (id: number): Promise<boolean> => {
     const resp = await apiClient.delete<boolean>(
       `/rest/V1/transferencia-source/${encodeURIComponent(id)}`,
       { headers: getAuthHeaders() }
     );
     return resp.data;
   },
 createMercancia: async (payload: {
       source_origen: string;
       source_destino: string;
       descripcion: string;
       creador: number;
       tipo: string;
       fecha: string;
       nombre_responsable: string;
       estado: 'c' | 'n' | 'f';
       es_masiva?: 's' | 'n';
     }): Promise<TransferSource> => {
           const resp = await apiClient.post<TransferSource>(
                 '/rest/V1/transferencia-source',
                 { transferenciaSource: payload },
                 { headers: getAuthHeaders() }
               );
       return resp.data;
     },

     getTransferencia: async (id: string): Promise<TransferenciaSourceDetail> => {
        const resp = await apiClient.get<TransferenciaSourceDetail>(
          `/rest/V1/transferencia-source/${encodeURIComponent(id)}`,
          { headers: getAuthHeaders() }
        );
        return resp.data;
      },

      lookupBarcode: async (
        barcode: string,
        sourceOrigen: string,
        bodegaId: number | string,
        normal:boolean
      ): Promise<BarcodeLookupItem[]> => {
        const resp = await apiClient.get<BarcodeLookupItem[]>(
          '/rest/V1/transferencia-source/barcode-lookup',
          {
            params: { barcode, sourceOrigen, bodegaId, normal },
            headers: getAuthHeaders()
          }
        );
        return resp.data;
      },

     ingresoProductos: async (payload: {
       data: {
         estado?: string;
         tipo?: string;
         ingreso_source_productos: Array<{
           transferencia_source_id: number;
           sku: string;
           cantidad: number;
           bodega_nombre: string;
           descripcion: string;
         }>;
       };
     }): Promise<boolean> => {
      const resp = await apiClient.post<boolean>(
        '/rest/V1/transferencia-source/ingreso-products',
        payload,
        { headers: getAuthHeaders() }
      );
      return resp.data;
    },
    salidaProductos: async (payload: {
      data: {
        estado?: string;
        tipo?: string;
        salida_source_productos: Array<{
          transferencia_source_id: number;
          sku: string;
          cantidad: number;
          bodega_id: number;
        }>;
      };
    }): Promise<boolean> => {
      const resp = await apiClient.post<boolean>(
        '/rest/V1/transferencia-source/salida-products',
        payload,
        { headers: getAuthHeaders() }
      );
      return resp.data;
    },

    processProducts: async (
      transferencia_source_id: number
    ): Promise<[TransferenciaSourceDetail, IngresoProcessResult[], SalidaProcessResult[]]> => {
      const resp = await apiClient.post<
        [TransferenciaSourceDetail, IngresoProcessResult[], SalidaProcessResult[]]
      >(
        '/rest/V1/transferencia-source/process-products',
        { data: { transferencia_source_id } },
        { headers: getAuthHeaders() }
      );
      return resp.data;
    },
    exportTransferenciaExcel: async (id: number): Promise<any[]> => {
      const resp = await apiClient.get<any[]>(
        `/rest/V1/transferenciasource/excel/${id}`,
        { headers: getAuthHeaders() }
      );
      return resp.data;
    },

  importCsv: async (payload: {
      csv_file: string;
      source_origen: string;
      source_destino: string;
      nombre_responsable: string;
      descripcion: string;
      estado: string;
      tipo: string;
      creador: string;
      es_masiva: string;
    }): Promise<{
      message: string;
      error: boolean;
      transferencia_source_id: string;
      file_path: string;
    }[]> => {
      const resp = await apiClient.post(
        '/rest/V1/transferencia-source/import-csv',
        { data: payload },
        { headers: getAuthHeaders() }
      );
      return resp.data;
    },
    
};

export const inventorySourcesApi = {
    getAll: async (): Promise<InventorySource[]> => {
      const resp = await apiClient.get<{
        items: InventorySource[];
      }>('/rest/all/V1/inventory/sources', {
        headers: {
          ...getAuthHeaders()
        }
      });
      return resp.data.items;
    }
  };

  export interface TransferenciaSourceDetail {
    transferencia_source_id: number;
    source_origen: string;
    source_destino: string;
    descripcion: string;
    creador: number;
    tipo: string;
    fecha: string;
    nombre_responsable: string;
    consecutivo: string;
    estado: string;
    productos_ingreso: string[];
    productos_salida: string[];
  }

  