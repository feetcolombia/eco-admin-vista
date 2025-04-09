import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '../lib/api';

export interface Curva {
  curva_producto_id: string;
  nombre: string;
  descripcion: string;
  tallas: {
    curva_producto_talla_id: string;
    curva_producto_id: string;
    talla: string;
  }[];
}

export interface CurvaLista {
  curva_producto_id: string;
  nombre: string;
  descripcion: string;
  tallas: {
    curva_producto_talla_id: string;
    curva_producto_id: string;
    talla: string;
  }[];
}

interface CreateCurvaData {
  data: {
    nombre: string;
    descripcion: string;
    tallas: { talla: number }[];
  };
}

interface UpdateCurvaData {
  data: {
    curva_producto_id: number;
    nombre: string;
    descripcion: string;
    tallas: { talla: number }[];
  };
}

const BASE_URL = 'https://stg.feetcolombia.com/rest/V1';

export const useCurvasApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getCurvas = async (): Promise<CurvaLista[]> => {
    setLoading(true);
    try {
      const response = await api.get("/feetproductos-curva/curvas");
      return response.data.map((curva: any) => ({
        curva_producto_id: curva.id,
        nombre: curva.value,
        descripcion: "",
        tallas: []
      }));
    } catch (error) {
      console.error("Erro ao buscar curvas:", error);
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

  const getCurva = async (id: string): Promise<Curva | null> => {
    setLoading(true);
    try {
      const response = await api.get(`/feetproductos-curva/curva/${id}`);
      const data = response.data;
      return {
        curva_producto_id: data[0],
        nombre: data[1],
        descripcion: data[2],
        tallas: data[3] || []
      };
    } catch (error) {
      console.error("Erro ao buscar curva:", error);
      toast({
        title: "Erro",
        description: "Erro ao buscar a curva. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createCurva = async (data: CreateCurvaData): Promise<boolean> => {
    setLoading(true);
    try {
      await api.post("/feetproductos-curva/curva", data);
      toast({
        title: "Sucesso",
        description: "Curva criada com sucesso!",
      });
      return true;
    } catch (error) {
      console.error("Erro ao criar curva:", error);
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

  const updateCurva = async (data: UpdateCurvaData): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.put("/feetproductos-curva/curva", data);
      if (response.status === 200) {
        toast({
          title: "Sucesso",
          description: "Curva atualizada com sucesso!",
        });
        return true;
      }
      throw new Error("Erro ao atualizar curva");
    } catch (error) {
      console.error("Erro ao atualizar curva:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar a curva. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCurva = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await api.delete(`/feetproductos-curva/curva/${id}`);
      if (response.status === 200) {
        toast({
          title: "Sucesso",
          description: "Curva excluída com sucesso!",
        });
        return true;
      }
      throw new Error("Erro ao excluir curva");
    } catch (error) {
      console.error("Erro ao excluir curva:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir a curva. Tente novamente.",
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
    getCurva,
    createCurva,
    updateCurva,
    deleteCurva,
  };
}; 