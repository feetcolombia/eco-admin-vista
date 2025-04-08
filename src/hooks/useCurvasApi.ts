import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Curva {
  curva_producto_id: string;
  nombre: string;
  descripcion: string;
}

interface CreateCurvaData {
  nombre: string;
  descripcion: string;
  tallas: { talla: number }[];
}

const BASE_URL = 'https://stg.feetcolombia.com/rest/V1';

export const useCurvasApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getCurvas = async (): Promise<Curva[]> => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/feetproductos-curva/getcurvas`);
      if (!response.ok) throw new Error('Erro ao buscar curvas');
      return await response.json();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar as curvas. Tente novamente.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCurva = async (data: CreateCurvaData): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/feetproductos-curva/curva`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) throw new Error('Erro ao criar curva');

      toast({
        title: "Sucesso",
        description: "Curva criada com sucesso!",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar a curva. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getCurvas,
    createCurva,
  };
}; 