import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface IngresoMercancia {
  ingresomercancia_id: number;
  source: string;
  creador: number;
  fecha: string;
  consecutivo: string;
  estado: string;
  nombre_responsable: string;
}

interface Bodega {
  bodega_id: number;
  bodega_source: string;
  bodega_nombre: string;
  bodega_altura: number;
  bodega_largo: number;
  bodega_profundidad: number;
  bodega_limite: number;
}

const IngresoMercanciaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const [ingreso, setIngreso] = useState<IngresoMercancia | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [totalScanned, setTotalScanned] = useState(0);

  const { loading, getIngresoById, getBodegas } = useIngresoMercanciaApi();

  useEffect(() => {
    if (id) {
      fetchIngreso();
    }
  }, [id]);

  useEffect(() => {
    if (ingreso?.source) {
      fetchBodegas();
    }
  }, [ingreso?.source]);

  const fetchIngreso = async () => {
    const data = await getIngresoById(Number(id));
    if (data) {
      setIngreso(data);
    }
  };

  const fetchBodegas = async () => {
    if (ingreso?.source) {
      const data = await getBodegas(ingreso.source);
      setBodegas(data);
      if (data.length > 0) {
        setSelectedBodega(data[0].bodega_nombre);
      }
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode) {
      // TODO: Implementar lógica de escaneamento
      setTotalScanned(prev => prev + 1);
      setBarcode("");
    }
  };

  if (loading || !ingreso) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Executar Processo de Ingreso</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-gray-100">
            Regresar
          </Button>
          <Button variant="outline" className="bg-gray-100">
            Guardar
          </Button>
          <Button className="bg-ecommerce-500 hover:bg-ecommerce-600">
            Completar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">ID</span>
            <span className="font-medium">{ingreso.ingresomercancia_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Origen</span>
            <span className="font-medium">{ingreso.source}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Usuario Responsable</span>
            <span className="font-medium">{ingreso.nombre_responsable}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Consecutivo</span>
            <span className="font-medium">{ingreso.consecutivo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha</span>
            <span className="font-medium">
              {format(new Date(ingreso.fecha), "dd/MM/yyyy")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estado</span>
            <span className="font-medium">{ingreso.estado === 'n' ? 'Nuevo' : ingreso.estado === 'p' ? 'Procesando' : 'Completado'}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sound">Sonido</Label>
                <Switch
                  id="sound"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              <div className="w-48">
                <Select value={selectedBodega} onValueChange={setSelectedBodega}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a posição" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas.map((bodega) => (
                      <SelectItem key={bodega.bodega_id} value={bodega.bodega_nombre}>
                        {bodega.bodega_nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-lg font-bold">
              Total Escaneado: {totalScanned}
            </div>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="w-full">
            <Input
              placeholder="Escanear o ingresar código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full"
              autoFocus
            />
          </form>

          <div className="mt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Position</th>
                  <th className="text-left py-2">Quantity</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Items escaneados serão exibidos aqui */}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresoMercanciaDetalle; 