import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBodegas } from '@/hooks/useBodegas';

interface BodegaSelectorProps {
  source: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export const BodegaSelector: React.FC<BodegaSelectorProps> = ({
  source,
  value,
  onChange,
  label = "Bodega",
  required = false
}) => {
  const { bodegas, loading } = useBodegas(source);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Carregando..." : "Selecionar bodega"} />
        </SelectTrigger>
        <SelectContent>
          {bodegas.map((bodega) => (
            <SelectItem key={bodega.bodega_id} value={String(bodega.bodega_id)}>
              {bodega.bodega_nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 