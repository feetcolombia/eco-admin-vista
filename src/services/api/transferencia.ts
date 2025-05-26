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

interface TransferenciaData {
  transferencia_bodega_id: string;
  soruce: string;
  id_bodega_origen: string;
  id_bodega_destino: string;
  cantidad: string;
  descripcion: string;
  responsable: string;
  estado: string;
  codigo: string;
  nombre_bodega_origen: string;
  nombre_bodega_destino: string;
  nombre_responsable: string;
  productos: Produto[];
  transferencia_total?: number;
}

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/rest/V1`;

export const transferenciaApi = {
  // Buscar transferência por ID
  getTransferencia: async (id: string, token: string): Promise<TransferenciaData | null> => {
    try {
      const response = await fetch(
        `${BASE_URL}/transferenciabodegas/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const [success, data] = await response.json();
      return success ? data : null;
    } catch (error) {
      console.error('Erro ao buscar transferência:', error);
      throw error;
    }
  },

  // Salvar transferência
  saveTransferencia: async (transferencia: TransferenciaData, token: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/transferenciabodegas`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              ...transferencia,
              estado: 'n'
            }
          })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Erro ao salvar transferência:', error);
      throw error;
    }
  },

  // Confirmar transferência
  confirmarTransferencia: async (transferencia: TransferenciaData, token: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/transferenciabodegas`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              transferencia_id: transferencia.transferencia_bodega_id,
              soruce: transferencia.soruce,
              responsable: transferencia.responsable,
              nombre_responsable: transferencia.nombre_responsable,
              id_bodega_origen: transferencia.id_bodega_origen,
              id_bodega_destino: transferencia.id_bodega_destino,
              descripcion: transferencia.descripcion,
              estado: 'f',
              productos: transferencia.productos,
              transferencia_total: 0
            }
          })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Erro ao confirmar transferência:', error);
      throw error;
    }
  },

  // Escanear código de barras
  scanBarcode: async (barcode: string, transferencia: TransferenciaData, token: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/transferenciabarcode`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            barcode,
            idBodegaOrigen: parseInt(transferencia.id_bodega_origen),
            idBodegaDestino: parseInt(transferencia.id_bodega_destino),
            source: transferencia.soruce,
            cantidadTransferir: 1
          })
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Erro ao escanear código de barras:', error);
      throw error;
    }
  }
}; 