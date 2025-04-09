import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Bodega } from '@/api/types/transferTypes';
import { useToast } from '@/components/ui/use-toast';

interface TransferenciaResponse {
  source: string;
  fecha: string;
  nombre_responsable: string;
  estado: string;
  consecutivo: string;
  codigo: string;
  transferenciamercancia_id: string;
  transferencia_id: string;
  descripcion: string;
  nombre_bodega_origen: string;
  nombre_bodega_destino: string;
}

const NovaTransferenciaBodega = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [origens, setOrigens] = useState<any[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    origem: '',
    descricao: '',
    cargaMasiva: 'nao',
    arquivo: null as File | null,
    bodegaOrigem: '',
    bodegaDestino: '',
  });

  useEffect(() => {
    fetchOrigens();
  }, []);

  useEffect(() => {
    if (formData.origem && formData.cargaMasiva === 'nao') {
      fetchBodegas();
    }
  }, [formData.origem, formData.cargaMasiva]);

  const fetchOrigens = async () => {
    try {
      const response = await fetch(
        'https://stg.feetcolombia.com/rest/all/V1/inventory/sources',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setOrigens(data.items || []);
    } catch (error) {
      console.error('Erro ao buscar origens:', error);
    }
  };

  const fetchBodegas = async () => {
    try {
      const response = await fetch(
        `https://stg.feetcolombia.com/rest/V1/feetbodega-mercancia/bodega/${formData.origem}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setBodegas(data);
    } catch (error) {
      console.error('Erro ao buscar bodegas:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, arquivo: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        data: {
          source: formData.origem,
          responsable: "1",
          nombre_responsable: "admin",
          id_bodega_origen: formData.cargaMasiva === 'nao' ? parseInt(formData.bodegaOrigem) : 0,
          id_bodega_destino: formData.cargaMasiva === 'nao' ? parseInt(formData.bodegaDestino) : 0,
          descripcion: formData.descricao,
          estado: "n",
          transferencia_total: 0
        }
      };

      const response = await fetch(
        'https://stg.feetcolombia.com/rest/V1/transferenciabodegas',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      
      if (response.ok && Array.isArray(responseData) && responseData.length > 0) {
        const transferencia = responseData[0] as TransferenciaResponse;
        if (transferencia.transferencia_id) {
          navigate(`/dashboard/transferencia-mercancia/${transferencia.transferencia_id}`);
          return;
        }
      }
      throw new Error('Erro ao criar transferência');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a transferência. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Novo Processo de Transferência</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/transferencia-mercancia')}
          >
            Regresar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
            disabled={loading}
          >
            Guardar
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origem<span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.origem}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                origem: value,
                bodegaOrigem: '',
                bodegaDestino: '',
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar origen" />
              </SelectTrigger>
              <SelectContent>
                {origens.map((origem) => (
                  <SelectItem key={origem.source_code} value={origem.source_code}>
                    {origem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha<span className="text-red-500">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción<span className="text-red-500">*</span>
            </label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ingresar descripción"
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Realizar carga masiva<span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.cargaMasiva}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                cargaMasiva: value,
                bodegaOrigem: '',
                bodegaDestino: '',
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.cargaMasiva === 'nao' && formData.origem && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega origen<span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.bodegaOrigem}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bodegaOrigem: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar bodega origen" />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bodega destino<span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.bodegaDestino}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bodegaDestino: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar bodega destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas
                      .filter(bodega => String(bodega.bodega_id) !== formData.bodegaOrigem)
                      .map((bodega) => (
                        <SelectItem key={bodega.bodega_id} value={String(bodega.bodega_id)}>
                          {bodega.bodega_nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formData.cargaMasiva === 'sim' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arquivo CSV
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-ecommerce-500 hover:text-ecommerce-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ecommerce-500"
                    >
                      <span>Upload um arquivo</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV até 10MB</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default NovaTransferenciaBodega; 