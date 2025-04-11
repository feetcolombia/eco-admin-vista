export enum TransferenciaEstado {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}

export interface FilterGroup {
  filters: Array<{
    field: string;
    value: string;
    condition_type: string;
  }>;
}

export interface TransferenciaBodega {
  transferencia_bodega_id: string;
  soruce: string;
  id_bodega_origen: string;
  id_bodega_destino: string;
  cantidad: string;
  descripcion: string;
  responsable: string;
  estado: TransferenciaEstado;
  codigo: string;
  created_at: string | null;
  updated_at: string | null;
  nombre_bodega_origen: string;
  nombre_bodega_destino: string;
  nombre_responsable: string;
  trasferencia_total: string;
  historico: string;
  es_masiva: string | null;
  bodega_origen: boolean | string;
  bodega_destino: string;
}

export interface Source {
  source_code: string;
  name: string;
  enabled: boolean;
  description?: string;
  latitude?: number;
  longitude?: number;
  country_id: string;
  region_id: number;
  region: string;
  postcode: string;
  use_default_carrier_config: boolean;
  carrier_links: any[];
  extension_attributes: {
    is_pickup_location_active: boolean;
    frontend_name: string;
  };
}

export interface TransferenciaBodegaResponse {
  items: TransferenciaBodega[];
  total_count: number;
  current_page: number;
  page_size: number;
}

export interface SourcesResponse {
  items: Source[];
  search_criteria: {
    filter_groups: FilterGroup[];
  };
  total_count: number;
}

export interface Bodega {
  bodega_id: number;
  bodega_source: string;
  bodega_nombre: string;
  bodega_altura: number;
  bodega_largo: number;
  bodega_profundidad: number;
  bodega_limite: number;
} 