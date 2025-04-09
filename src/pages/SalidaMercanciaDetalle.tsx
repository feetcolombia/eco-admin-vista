import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSalidaMercanciaApi } from "@/hooks/useSalidaMercanciaApi";
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

interface SalidaMercancia {
  salidamercancia_id: number;
  source: string;
  creador: number;
  fecha: string;
  consecutivo: string;
  estado: string;
  descripcion: string;
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

const SalidaMercanciaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const [salida, setSalida] = useState<SalidaMercancia | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [totalScanned, setTotalScanned] = useState(0);

  const { loading, getSalidaById, getBodegas } = useSalidaMercanciaApi();

  useEffect(() => {
    if (id) {
      fetchSalida();
    }
  }, [id]);

  useEffect(() => {
    if (salida?.source) {
      fetchBodegas();
    }
  }, [salida?.source]);

  const fetchSalida = async () => {
    const data = await getSalidaById(Number(id));
    if (data) {
      setSalida(data);
    }
  };

  const fetchBodegas = async () => {
    if (salida?.source) {
      const data = await getBodegas(salida.source);
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

  if (loading || !salida) {
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
          <h1 className="text-2xl font-bold">Executar Processo de Saída</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-gray-100">
            Voltar
          </Button>
          <Button variant="outline" className="bg-gray-100">
            Salvar
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
            <span className="font-medium">{salida.salidamercancia_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Origem</span>
            <span className="font-medium">{salida.source}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Usuário Responsável</span>
            <span className="font-medium">{salida.nombre_responsable}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Consecutivo</span>
            <span className="font-medium">{salida.consecutivo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data</span>
            <span className="font-medium">
              {format(new Date(salida.fecha), "dd/MM/yyyy")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estado</span>
            <span className="font-medium">
              {salida.estado === 'n' ? 'Novo' : salida.estado === 'p' ? 'Processando' : 'Completado'}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sound">Som</Label>
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
              placeholder="Escanear ou digitar código de barras"
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
                  <th className="text-left py-2">Posição</th>
                  <th className="text-left py-2">Quantidade</th>
                  <th className="text-left py-2">Ações</th>
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

export default SalidaMercanciaDetalle; 