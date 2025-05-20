import { useState, useEffect } from 'react';
import { apiClient, getAuthHeaders } from "@/api/apiConfig";
import { toast } from "sonner"; // Ou useToast, dependendo do que está configurado

export interface AttributeOption {
  label: string;
  value: string;
  disabled?: boolean; // Magento pode retornar 'disabled'
}

export type AttributeOptionsMap = Record<string, AttributeOption[]>;

export function useAttributeOptions(attributeCodes: string[]) {
  const [options, setOptions] = useState<AttributeOptionsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!attributeCodes || attributeCodes.length === 0) {
      setLoading(false);
      setOptions({});
      return;
    }

    const fetchAllOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises = attributeCodes.map(code =>
          apiClient.get<AttributeOption[]>(`/rest/V1/products/attributes/${code}/options`, { 
            headers: getAuthHeaders() 
          })
        );
        
        const responses = await Promise.all(promises);
        
        const newOptions = attributeCodes.reduce((acc, code, index) => {
          // Filtra opções que não têm label ou valor, que são inválidas
          acc[code] = responses[index].data.filter(option => option.label && option.value);
          return acc;
        }, {} as AttributeOptionsMap);
        
        setOptions(newOptions);
      } catch (err) {
        console.error('Erro ao carregar opções de atributos:', err);
        toast.error('Erro ao carregar opções de atributos.');
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeCodes.join(',')]); // Recarrega se a lista de códigos mudar

  return { options, loading, error };
} 