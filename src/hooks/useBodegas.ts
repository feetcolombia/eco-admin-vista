import { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiConfig';

interface Bodega {
  bodega_id: number;
  bodega_nombre: string;
}

interface UseBodegasResult {
  bodegas: Bodega[];
  loading: boolean;
  error: string | null;
}

export function useBodegas(source: string): UseBodegasResult {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBodegas = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/bodegas/${source}`);
        setBodegas(response.data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar bodegas');
        console.error('Erro ao carregar bodegas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBodegas();
  }, [source]);

  return { bodegas, loading, error };
} 