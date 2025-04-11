import { z } from 'zod';
import { BaseEntity, BaseEntitySchema, PaginatedResponse, PaginatedResponseSchema, Status } from '@/types/shared';

export enum ProductStatus {
  ENABLED = 1,
  DISABLED = 2,
}

export enum ProductType {
  SIMPLE = 'simple',
  CONFIGURABLE = 'configurable',
  BUNDLE = 'bundle',
}

export interface CustomAttribute {
  attribute_code: string;
  value: string | string[];
}

export interface CategoryLink {
  position: number;
  category_id: string;
}

export interface ConfigurableProductOption {
  id: number;
  attribute_id: string;
  label: string;
  position: number;
  values: Array<{
    value_index: number;
  }>;
}

export interface ProductExtensionAttributes {
  website_ids: number[];
  category_links: CategoryLink[];
  configurable_product_options?: ConfigurableProductOption[];
  configurable_product_links?: number[];
}

export interface Product extends Omit<BaseEntity, 'status'> {
  sku: string;
  name: string;
  price: number;
  status: ProductStatus;
  type_id: ProductType;
  weight: number;
  custom_attributes: CustomAttribute[];
  extension_attributes: ProductExtensionAttributes;
  is_closedbox: boolean;
}

export interface SearchCriteria {
  filter_groups: Array<{
    filters: Array<{
      field: string;
      value: string;
      condition_type: string;
    }>;
  }>;
  page_size: number;
  current_page: number;
}

export interface ProductsResponse extends PaginatedResponse<Product> {
  search_criteria: SearchCriteria;
}

// Schemas de validação
export const CustomAttributeSchema = z.object({
  attribute_code: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
});

export const CategoryLinkSchema = z.object({
  position: z.number(),
  category_id: z.string(),
});

export const ConfigurableProductOptionSchema = z.object({
  id: z.number(),
  attribute_id: z.string(),
  label: z.string(),
  position: z.number(),
  values: z.array(z.object({
    value_index: z.number(),
  })),
});

export const ProductExtensionAttributesSchema = z.object({
  website_ids: z.array(z.number()),
  category_links: z.array(CategoryLinkSchema),
  configurable_product_options: z.array(ConfigurableProductOptionSchema).optional(),
  configurable_product_links: z.array(z.number()).optional(),
});

export const ProductSchema = z.object({
  ...BaseEntitySchema.omit({ status: true }).shape,
  sku: z.string(),
  name: z.string(),
  price: z.number(),
  status: z.nativeEnum(ProductStatus),
  type_id: z.nativeEnum(ProductType),
  weight: z.number(),
  custom_attributes: z.array(CustomAttributeSchema),
  extension_attributes: ProductExtensionAttributesSchema,
  is_closedbox: z.boolean(),
});

export const SearchCriteriaSchema = z.object({
  filter_groups: z.array(z.object({
    filters: z.array(z.object({
      field: z.string(),
      value: z.string(),
      condition_type: z.string(),
    })),
  })),
  page_size: z.number(),
  current_page: z.number(),
});

export const ProductsResponseSchema = PaginatedResponseSchema(ProductSchema).extend({
  search_criteria: SearchCriteriaSchema,
});

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
    status: ProductStatus;
    visibility: number;
    type_id: ProductType;
    attribute_set_id: number;
    weight: number;
    custom_attributes: CustomAttribute[];
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
