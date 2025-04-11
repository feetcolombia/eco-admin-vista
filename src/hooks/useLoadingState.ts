import { useState, useCallback } from 'react';

export const useLoadingState = () => {
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      return await promise;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading
  };
}; 