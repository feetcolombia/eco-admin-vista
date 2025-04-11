import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiError } from './useApiError';
import { useLoadingState } from './useLoadingState';

export interface Bodega {
  bodega_id: number;
  bodega_nombre: string;
}

export const useBodegas = (source: string) => {
  const { token } = useAuth();
  const { handleApiError } = useApiError();
  const { loading, withLoading } = useLoadingState();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);

  useEffect(() => {
    if (source) {
      fetchBodegas();
    }
  }, [source]);

  const fetchBodegas = async () => {
    try {
      const response = await withLoading(
        fetch(
          `https://stg.feetcolombia.com/rest/V1/feetbodega-mercancia/bodega/${source}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar bodegas');
      }

      const data = await response.json();
      setBodegas(data);
    } catch (error) {
      handleApiError(error);
      setBodegas([]);
    }
  };

  return {
    bodegas,
    loading,
    fetchBodegas
  };
}; 