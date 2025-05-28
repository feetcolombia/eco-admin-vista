import { api } from './api';
import { Product, ProductsResponse, TallaOption, BoxProduct, ProductDetail } from './types/productTypes';

interface AttributeOption {
  label: string;
  value: string;
}

export const productsApi = {
  getProducts: async (page: number = 1, pageSize: number = 15): Promise<ProductsResponse> => {
    try {
      const response = await api.get<ProductsResponse>('/rest/V1/products', {
        params: {
          'searchCriteria[filter_groups][0][filters][0][field]': 'type_id',
          'searchCriteria[filter_groups][0][filters][0][value]': 'configurable',
          'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq',
          'searchCriteria[currentPage]': page,
          'searchCriteria[pageSize]': pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  getProductChildren: async (productSku: string): Promise<Product[]> => {
    try {
      const response = await api.get<Product[]>(
        `/rest/V1/configurable-products/${encodeURIComponent(productSku)}/children`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos filhos:', error);
      throw error;
    }
  },

  getTallaOptions: async (): Promise<TallaOption[]> => {
    try {
      const response = await api.get<TallaOption[]>(
        '/rest/V1/products/attributes/talla/options'
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de tamanho:', error);
      throw error;
    }
  },

  createBox: async (boxData: BoxProduct): Promise<void> => {
    try {
      await api.post('/rest/V1/products', boxData);
    } catch (error) {
      console.error('Erro ao criar caixa:', error);
      throw error;
    }
  },

  setAsChild: async (parentSku: string, childSku: string): Promise<void> => {
    try {
      await api.post(`/rest/V1/configurable-products/${parentSku}/child`, {
        childSku
      });
    } catch (error) {
      console.error('Erro ao definir produto filho:', error);
      throw error;
    }
  },

  saveBoxDetails: async (boxSku: string, details: ProductDetail[]): Promise<void> => {
    try {
      await api.post(`/rest/V1/product/${boxSku}/details`, {
        productDetails: details
      });
    } catch (error) {
      console.error('Erro ao salvar detalhes da caixa:', error);
      throw error;
    }
  },

  getMarcaOptions: async (): Promise<AttributeOption[]> => {
    try {
      const response = await api.get<AttributeOption[]>(
        '/rest/V1/products/attributes/marca/options'
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de marca:', error);
      throw error;
    }
  },

  getColorOptions: async (): Promise<AttributeOption[]> => {
    try {
      const response = await api.get<AttributeOption[]>(
        '/rest/V1/products/attributes/color/options'
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de cor:', error);
      throw error;
    }
  },

  getMaterialOptions: async (): Promise<AttributeOption[]> => {
    try {
      const response = await api.get<AttributeOption[]>(
        '/rest/V1/products/attributes/material/options'
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de material:', error);
      throw error;
    }
  },

  getEstiloOptions: async (): Promise<AttributeOption[]> => {
    try {
      const response = await api.get<AttributeOption[]>(
        '/rest/V1/products/attributes/estilo/options'
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de estilo:', error);
      throw error;
    }
  },

  getProductBySku: async (sku: string): Promise<Product | null> => {
    try {
      const response = await api.get<Product>(`/rest/V1/products/${encodeURIComponent(sku)}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }
};
