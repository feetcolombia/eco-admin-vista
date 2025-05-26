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
    os_barcode_data?: string[];
    source_stock_data?: string[];
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

export interface Website {
  id: number;
  code: string;
  name: string;
  default_group_id: number;
}

export interface Category {
  id: number;
  parent_id: number;
  name: string;
  is_active: boolean;
  position: number;
  level: number;
  product_count: number;
  children_data: Category[];
}
