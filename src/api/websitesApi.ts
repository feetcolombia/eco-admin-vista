
import { apiClient, getAuthHeaders } from './apiConfig';
import { Website } from './types/productTypes';

export const websitesApi = {
  getWebsites: async (): Promise<Website[]> => {
    try {
      const response = await apiClient.get<Website[]>('/rest/V1/store/websites', {
        headers: getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar websites:', error);
      throw error;
    }
  }
};
