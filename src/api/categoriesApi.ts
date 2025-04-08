
import { apiClient, getAuthHeaders } from './apiConfig';
import { Category } from './types/productTypes';

export const categoriesApi = {
  getCategories: async (): Promise<Category> => {
    try {
      const response = await apiClient.get<Category>('/rest/V1/categories/', {
        headers: getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }
};
