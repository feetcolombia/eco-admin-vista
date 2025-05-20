import { useState, useCallback } from 'react';
import { toast } from 'sonner'; // ou useToast do seu projeto

export interface UseFormHandlerProps<T, R = void> {
  initialState: T;
  onSubmit: (formData: T) => Promise<R>; // A função de submit pode retornar algo se necessário
  onSuccess?: (response?: R) => void; // Callback opcional em caso de sucesso
  onError?: (error: Error) => void; // Callback opcional em caso de erro
  successMessage?: string;
  errorMessage?: string;
}

export function useFormHandler<T, R = void>(props: UseFormHandlerProps<T, R>) {
  const {
    initialState,
    onSubmit,
    onSuccess,
    onError,
    successMessage = 'Operação realizada com sucesso!',
    errorMessage = 'Ocorreu um erro ao realizar a operação.',
  } = props;

  const [formData, setFormData] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    
    // Para checkboxes, verificar o estado 'checked'
    // Para outros inputs, usar 'value'
    const inputValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: inputValue,
    }));
  }, []);

  // Função para atualizar campos específicos do formulário de forma programática
  const setFormField = useCallback((fieldName: keyof T, value: T[keyof T]) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);
  
  // Função para resetar o formulário para o estado inicial ou um novo estado
  const resetForm = useCallback((newState?: T) => {
    setFormData(newState || initialState);
    setError(null);
  }, [initialState]);

  const handleSubmit = useCallback(async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await onSubmit(formData);
      toast.success(successMessage);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error(errorMessage, err);
      toast.error(errorMessage);
      setError(err as Error);
      if (onError) {
        onError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, onSuccess, onError, successMessage, errorMessage]);

  return {
    formData,
    setFormData, // Permite modificar o formData inteiro se necessário
    handleChange,
    setFormField, // Permite modificar um campo específico
    handleSubmit,
    resetForm,
    loading,
    error,
  };
} 