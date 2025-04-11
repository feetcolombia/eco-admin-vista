import { useBodegas } from '@/hooks/useBodegas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BodegaSelectorProps {
  source: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

/**
 * Componente de seleção de bodega
 * @param {string} source - Fonte dos dados da bodega
 * @param {string} value - Valor selecionado
 * @param {(value: string) => void} onChange - Função chamada quando o valor é alterado
 * @param {string} [label="Bodega"] - Rótulo do seletor
 * @param {boolean} [required=false] - Indica se o campo é obrigatório
 */
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