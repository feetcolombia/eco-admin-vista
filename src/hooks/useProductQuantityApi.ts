import { useState } from 'react';
import axios from 'axios';

interface ProductQuantityResponse {
  inventory_quantity: number;
  product_sku: string;
  sku: string;
  transferencia_quantity: number;
  product_id: string | null;
  bodega_nombre: string;
  barcode: string;
}

export const useProductQuantityApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProductQuantity = async (barcode: string, bodegaId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://stg.feetcolombia.com/rest/V1/feetmercancia-salida/productquantity`,
        {
          params: {
            source: 'default',
            bodegaId,
            barcode
          }
        }
      );
      return response.data;
    } catch (err) {
      setError('Erro ao buscar quantidade do produto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getProductQuantity
  };
}; 