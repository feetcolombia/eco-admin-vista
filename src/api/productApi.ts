
import { productsApi } from './productsApi';
import { websitesApi } from './websitesApi';
import { categoriesApi } from './categoriesApi';
export * from './types/productTypes';

// Create a combined API object with the same interface as the original
const productApi = {
  // Products
  getProducts: productsApi.getProducts,
  getProductChildren: productsApi.getProductChildren,
  getTallaOptions: productsApi.getTallaOptions,
  createBox: productsApi.createBox,
  setAsChild: productsApi.setAsChild,
  saveBoxDetails: productsApi.saveBoxDetails,
  
  // Websites
  getWebsites: websitesApi.getWebsites,
  
  // Categories
  getCategories: categoriesApi.getCategories
};

export default productApi;
