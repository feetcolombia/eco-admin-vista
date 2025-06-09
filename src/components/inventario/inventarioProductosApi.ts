import axios from 'axios';

// const BASE_URL = 'https://stg.feetcolombia.com/rest/V1';
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/rest/V1`;
export const UrlImagen = 'https://catalogo.feetcolombia.com/media/catalog/product/';

export const inventarioProductosApi = {
  getCustomProducts: async (type?: string, brand?: string): Promise<any> => {
    let url = `${BASE_URL}/custom-products?`;
    url += `type=${type ? encodeURIComponent(type) : 'M'}`;
    if(brand) {
      url += `&brand=${encodeURIComponent(brand)}`;
    }
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching custom products:", error);
      throw error;
    }
  }
};

export default inventarioProductosApi;