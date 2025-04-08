import axios from 'axios';

const API_BASE_URL = 'https://stg.feetcolombia.com';

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  status: number;
  type_id: string;
  created_at: string;
  updated_at: string;
  weight: number;
  custom_attributes: Array<{
    attribute_code: string;
    value: string | string[];
  }>;
  extension_attributes: {
    website_ids: number[];
    category_links: Array<{
      position: number;
      category_id: string;
    }>;
    configurable_product_options?: Array<{
      id: number;
      attribute_id: string;
      label: string;
      position: number;
      values: Array<{
        value_index: number;
      }>;
    }>;
    configurable_product_links?: number[];
  };
  is_closedbox: boolean;
}

export interface ProductsResponse {
  items: Product[];
  total_count: number;
  search_criteria: any;
}

export interface TallaOption {
  label: string;
  value: string;
}

export interface ProductDetail {
  sku: string;
  size: string;
  quantity: number;
}

export interface BoxProduct {
  product: {
    sku: string;
    name: string;
    price: number;
    status: number;
    visibility: number;
    type_id: string;
    attribute_set_id: number;
    weight: number;
    custom_attributes: Array<{
      attribute_code: string;
      value: string | boolean;
    }>;
  };
}

const productApi = {
  getProducts: async (page: number = 1, pageSize: number = 15) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      const response = await axios.get<ProductsResponse>(`${API_BASE_URL}/rest/V1/products`, {
        params: {
          'searchCriteria[filter_groups][0][filters][0][field]': 'type_id',
          'searchCriteria[filter_groups][0][filters][0][value]': 'configurable',
          'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq',
          'searchCriteria[currentPage]': page,
          'searchCriteria[pageSize]': pageSize
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
  },

  getProductChildren: async (productSku: string) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      const response = await axios.get<Product[]>(`${API_BASE_URL}/rest/V1/configurable-products/${encodeURIComponent(productSku)}/children`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar produtos filhos:', error);
      throw error;
    }
  },

  getTallaOptions: async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      const response = await axios.get<TallaOption[]>(`${API_BASE_URL}/rest/V1/products/attributes/talla/options`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar opções de tamanho:', error);
      throw error;
    }
  },

  createBox: async (boxData: BoxProduct) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      await axios.post(`${API_BASE_URL}/rest/V1/products`, boxData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erro ao criar caixa:', error);
      throw error;
    }
  },

  setAsChild: async (parentSku: string, childSku: string) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      await axios.post(`${API_BASE_URL}/rest/V1/configurable-products/${parentSku}/child`, {
        childSku
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erro ao definir produto filho:', error);
      throw error;
    }
  },

  saveBoxDetails: async (boxSku: string, details: ProductDetail[]) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    try {
      await axios.post(`${API_BASE_URL}/rest/V1/product/${boxSku}/details`, {
        productDetails: details
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erro ao salvar detalhes da caixa:', error);
      throw error;
    }
  }
};

export default productApi; 