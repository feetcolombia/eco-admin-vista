
import { apiClient, getAuthHeaders } from './apiConfig';
import { Product, ProductsResponse, TallaOption, BoxProduct, ProductDetail } from './types/productTypes';

export const productsApi = {
  getProducts: async (page: number = 1, pageSize: number = 15): Promise<ProductsResponse> => {
    try {
      const response = await apiClient.get<ProductsResponse>('/rest/V1/products', {
        params: {
          'searchCriteria[filter_groups][0][filters][0][field]': 'type_id',
          'searchCriteria[filter_groups][0][filters][0][value]': 'configurable',
          'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq',
          'searchCriteria[currentPage]': page,
          'searchCriteria[pageSize]': pageSize
        },
        headers: getAuthHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  getProductChildren: async (productSku: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>(
        `/rest/V1/configurable-products/${encodeURIComponent(productSku)}/children`, 
        { headers: getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos filhos:', error);
      throw error;
    }
  },

  getTallaOptions: async (): Promise<TallaOption[]> => {
    try {
      const response = await apiClient.get<TallaOption[]>(
        '/rest/V1/products/attributes/talla/options', 
        { headers: getAuthHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de tamanho:', error);
      throw error;
    }
  },

  createBox: async (boxData: BoxProduct): Promise<void> => {
    try {
      await apiClient.post('/rest/V1/products', boxData, { 
        headers: getAuthHeaders() 
      });
    } catch (error) {
      console.error('Erro ao criar caixa:', error);
      throw error;
    }
  },

  setAsChild: async (parentSku: string, childSku: string): Promise<void> => {
    try {
      await apiClient.post(`/rest/V1/configurable-products/${parentSku}/child`, {
        childSku
      }, { headers: getAuthHeaders() });
    } catch (error) {
      console.error('Erro ao definir produto filho:', error);
      throw error;
    }
  },

  saveBoxDetails: async (boxSku: string, details: ProductDetail[]): Promise<void> => {
    try {
      await apiClient.post(`/rest/V1/product/${boxSku}/details`, {
        productDetails: details
      }, { headers: getAuthHeaders() });
    } catch (error) {
      console.error('Erro ao salvar detalhes da caixa:', error);
      throw error;
    }
  }
};
