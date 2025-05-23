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
import { transferBodegasApi,Source } from '@/api/transferBodegasApi';
import { toast } from "sonner";

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
    cargaMasiva: 'n',
    arquivo: null as File | null,
    bodegaOrigem: '',
    bodegaDestino: '',
  });
  const [csvValidationResult, setCsvValidationResult] = useState<{ sku: string; error: string }[] | null>(null);

  useEffect(() => {
    fetchOrigens();
  }, []);

  useEffect(() => {
    if (formData.origem && formData.cargaMasiva === 'n') {
      fetchBodegas();
    }
  }, [formData.origem, formData.cargaMasiva]);

  const fetchOrigens = async () => {
    try {
      const items: Source[] = await transferBodegasApi.getOrigens();
      setOrigens(items);
    } catch (error) {
      console.error('Error al obtener sources:', error);
    }
  };

  const fetchBodegas = async () => {
    try {
      const items = await transferBodegasApi.getBodegasMercancia(formData.origem);
      setBodegas(items);
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
    if (!formData.origem) {
      toast({ variant: 'destructive', title: 'Error', description: 'Origen es obligatorio.' })
      return
    }
    if (!date) {
      toast({ variant: 'destructive', title: 'Error', description: 'Fecha es obligatoria.' })
      return
    }
    if (!formData.descricao.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Descripción es obligatoria.' })
      return
    }
    if (!formData.cargaMasiva) {
      toast({ variant: 'destructive', title: 'Error', description: 'Seleccione si realizará carga masiva.' })
      return
    }
    if (formData.cargaMasiva === 's') {
      if (!formData.arquivo) {
        toast({ variant: 'destructive', title: 'Error', description: 'Archivo CSV es obligatorio para carga masiva.' });
        return;
      }
      if (formData.arquivo.type !== 'text/csv') {
        toast({ variant: 'destructive', title: 'Error', description: 'El archivo debe ser un CSV válido.' });
        return;
      }
    }
    // si NO es carga masiva, validar bodegas
    if (formData.cargaMasiva === 'n') {
      if (!formData.bodegaOrigem) {
        toast({ variant: 'destructive', title: 'Error', description: 'Bodega origen es obligatoria.' })
        return
      }
      if (!formData.bodegaDestino) {
        toast({ variant: 'destructive', title: 'Error', description: 'Bodega destino es obligatoria.' })
        return
      }
    }
    setLoading(true);

    try {

      const payload = {
        data: {
          transferencia_id: 0,
          soruce: formData.origem,
          source: formData.origem,
          responsable: "1",
          nombre_responsable: "admin",
          id_bodega_origen: formData.cargaMasiva === 'n' ? parseInt(formData.bodegaOrigem) : 0,
          id_bodega_destino: formData.cargaMasiva === 'n' ? parseInt(formData.bodegaDestino) : 0,
          descripcion: formData.descricao,
          estado: "n",
          es_masiva: formData.cargaMasiva,
          created_at: format(date, "yyyy-MM-dd HH:mm:ss"),
          historico: "n"
        }
      };

      const responseData = await transferBodegasApi.updateTransferencia(payload);
      
      if (responseData.length > 0) {
        const t = responseData[0];
        navigate(`/dashboard/transferencia-mercancia/${t.transferencia_id}`);
        return;
      }
      throw new Error('Error al crear la transferência');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "No se pudo crear la transferencia, intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidarGuardar = () => {

    if (!formData.arquivo) {
      toast({ variant: 'destructive', title: 'Error', description: 'Archivo CSV es obligatorio.' });
      return;
    }
  
    if (formData.arquivo.type !== 'text/csv') {
      toast({ variant: 'destructive', title: 'Error', description: 'El archivo debe ser un CSV válido.' });
      return;
    }
  
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result;
        if (typeof csvText === "string") {
          // Construye un objeto con los campos requeridos
          const data = {
            csv_file: csvText,
            source: formData.origem,
            nombre_responsable: "admin",
            fecha: format(date, "yyyy-MM-dd HH:mm:ss"),
            descripcion: formData.descricao,
            responsable: 1
          };

          const result = await transferBodegasApi.validateAndUploadCSV(data);
          console.log('Resultado de la validación:', result[0].error);
          if (result.length > 0 && !result[0].error) {
            toast({
              variant: "success",
              title: "Éxito",
              description: "Datos validados y guardados correctamente, recuerde que debe en la siguiente pantalla completar el proceso dando click en el botón de guardar",
            });
            setCsvValidationResult(null);
            setTimeout(() => {
              navigate(`/dashboard/transferencia-mercancia/${result[0].transferencia_bodega_id}`);
            }, 1500);
          } else if (result.length > 0 && result[0].error) {
            // Parsear el mensaje de error para extraer sku y error
            const errors = result[0].message.split(',').map(msg => {
              const [skuPart, ...errorPart] = msg.split(':');
              return { sku: skuPart.trim(), error: errorPart.join(':').trim() };
            });
            setCsvValidationResult(errors);
          }
        }
      };
      reader.readAsText(formData.arquivo);
    } catch (error) {
      console.error('Error al validar CSV:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar el archivo CSV, intente nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Proceso de Transferencia</h1>
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
              Origen<span className="text-red-500">*</span>
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
              Realizar Carga Masiva<span className="text-red-500">*</span>
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
                <SelectItem value="s">Si</SelectItem>
                <SelectItem value="n">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.origem && formData.cargaMasiva === 'n' && (
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
                    <SelectValue placeholder="Seleccionar bodega origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ninguna</SelectItem>
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
                    <SelectValue placeholder="Seleccionar bodega destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ninguna</SelectItem>
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
          {formData.cargaMasiva === 's' && (
            <>
              <div>
                <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo CSV<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    id="arquivo"
                    accept=".csv"
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, arquivo: e.target.files?.[0] || null }))
                    }
                    required
                  />
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/downloads/transferenciaBodega/transferencia_bodega_prueba.csv', '_blank')}
                  >
                    Descargar Plantilla CSV
                  </Button>
                </div>
              </div>
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  onClick={handleValidarGuardar}
                  className="bg-ecommerce-500 hover:bg-ecommerce-600"
                >
                  Validar y Guardar
                </Button>
              </div>
              {csvValidationResult && csvValidationResult.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">Errores de Validación</h3>
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2">SKU</th>
                      <th className="border p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvValidationResult.map((errorItem, index) => (
                      <tr key={index}>
                        <td className="border p-2">{errorItem.sku}</td>
                        <td className="border p-2">{errorItem.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default NovaTransferenciaBodega; 