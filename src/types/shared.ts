import { z } from 'zod';

// Enums compartilhados
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export enum EntityType {
  PRODUCT = 'product',
  CATEGORY = 'category',
  ORDER = 'order',
  TRANSFER = 'transfer',
}

// Interfaces base
export interface BaseEntity {
  id: string | number;
  created_at: string;
  updated_at: string;
  status: Status;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  current_page: number;
  page_size: number;
}

// Schemas de validação
export const BaseEntitySchema = z.object({
  id: z.union([z.string(), z.number()]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  status: z.nativeEnum(Status),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total_count: z.number(),
    current_page: z.number(),
    page_size: z.number(),
  });

// Tipos utilitários
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}; 