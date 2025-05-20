import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { toast } from "sonner";

interface IngresoMercanciaProducto {
  ingreso_mercancia_producto_id: string;
  ingreso_mercancia_id: string;
  producto: string;
  sku: string;
  cantidad: string;
  bodega_id: string;
  bodega_nombre: string;
}

interface IngresoMercancia {
  ingresomercancia_id: string;
  source: string;
  creador: string;
  fecha: string;
  consecutivo: string;
  estado: string;
  nombre_responsable: string;
  es_masiva: string;
  productos: IngresoMercanciaProducto[];
}

interface IngresoMercanciaResponse {
  items: IngresoMercancia[];
  search_criteria: {
    filter_groups: Array<{
      filters: Array<{
        field: string;
        value: string;
        condition_type: string;
      }>;
    }>;
  };
  total_count: number;
}

interface IngresoMercanciaProductoPayload {
  ingreso_mercancia_id: string;
  sku: string;
  cantidad: number;
  bodega_id: string;
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

interface ScannedItem {
  sku: string;
  position: string;
  quantity: number;
}

interface Source {
  source_code: string;
  name: string;
  enabled: boolean;
  description?: string;
  extension_attributes: {
    is_pickup_location_active: boolean;
    frontend_name: string;
  };
}

interface SourceResponse {
  items: Source[];
  total_count: number;
}

const IngresoMercanciaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ingreso, setIngreso] = useState<IngresoMercancia | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [totalScanned, setTotalScanned] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);

  const { loading, getIngresoById, getBodegas, getBarcodeData, saveIngresoMercanciaProductos, getSources } = useIngresoMercanciaApi();

  useEffect(() => {
    if (id) {
      fetchIngreso();
      fetchSources();
    }
  }, [id]);

  useEffect(() => {
    if (ingreso?.source) {
      fetchBodegas();
    }
  }, [ingreso?.source]);

  useEffect(() => {
    if (ingreso?.productos) {
      // Converte os produtos do ingresso para o formato de itens escaneados
      const items: ScannedItem[] = ingreso.productos.map(producto => ({
        sku: producto.sku,
        position: producto.bodega_nombre,
        quantity: parseInt(producto.cantidad)
      }));
      setScannedItems(items);
      setTotalScanned(items.reduce((total, item) => total + item.quantity, 0));
    }
  }, [ingreso?.productos]);

  const fetchIngreso = async () => {
    const data = await getIngresoById(Number(id));
    if (data?.items?.[0]) {
      setIngreso(data.items[0]);
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

  const fetchSources = async () => {
    const sourcesData = await getSources();
    setSources(sourcesData);
  };

  const getSourceName = (sourceCode: string) => {
    const source = sources.find(s => s.source_code === sourceCode);
    return source ? source.name : sourceCode;
  };

  const playBeep = (success: boolean) => {
    if (!soundEnabled) return;
    
    try {
      // Criar um contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configurar o som
      oscillator.type = success ? 'sine' : 'square';
      oscillator.frequency.setValueAtTime(success ? 800 : 400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      // Conectar os nós
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Tocar o som
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Erro ao reproduzir som:', error);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const response = await getBarcodeData(barcode);
      
      // Verificar se o produto já existe com o mesmo SKU e mesma posição
      const existingItemIndex = scannedItems.findIndex(
        item => item.sku === response.product_sku && item.position === selectedBodega
      );

      if (existingItemIndex !== -1) {
        // Se o produto já existe, apenas incrementa a quantidade
        setScannedItems(prev => prev.map((item, index) => {
          if (index === existingItemIndex) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        }));
        playBeep(true);
      } else {
        // Se o produto não existe, adiciona como novo
        const newItem: ScannedItem = {
          sku: response.product_sku,
          position: selectedBodega,
          quantity: 1
        };
        setScannedItems(prev => [...prev, newItem]);
        playBeep(true);
      }

      setTotalScanned(prev => prev + 1);
      setBarcode("");
    } catch (error) {
      playBeep(false);
      // O toast de erro já é mostrado no hook
    }
  };

  const handleRemoveItem = (sku: string, position: string) => {
    setScannedItems(prev => {
      const updatedItems = prev.filter(
        item => !(item.sku === sku && item.position === position)
      );
      setTotalScanned(
        updatedItems.reduce((total, item) => total + item.quantity, 0)
      );
      return updatedItems;
    });
  };

  const handleSave = async () => {
    if (!ingreso || scannedItems.length === 0) return;

    const productos: IngresoMercanciaProductoPayload[] = scannedItems.map(item => {
      const bodega = bodegas.find(b => b.bodega_nombre === item.position);
      if (!bodega) throw new Error(`Bodega no encontrada: ${item.position}`);

      return {
        ingreso_mercancia_id: ingreso.ingresomercancia_id,
        sku: item.sku,
        cantidad: item.quantity,
        bodega_id: bodega.bodega_id.toString()
      };
    });

    const success = await saveIngresoMercanciaProductos(productos);
    if (success) {
      toast.success("Datos guardados correctamente");
      navigate(`/dashboard/ingreso-mercancia/${ingreso.ingresomercancia_id}`);
    }
  };

  const handleCompletar = async () => {
    if (scannedItems.length === 0) return;
    
    if (!ingreso) return;

    const productos: IngresoMercanciaProductoPayload[] = scannedItems.map(item => {
      const bodega = bodegas.find(b => b.bodega_nombre === item.position);
      if (!bodega) throw new Error(`Bodega no encontrada: ${item.position}`);

      return {
        ingreso_mercancia_id: ingreso.ingresomercancia_id,
        sku: item.sku,
        cantidad: item.quantity,
        bodega_id: bodega.bodega_id.toString()
      };
    });

    const success = await saveIngresoMercanciaProductos(productos);
    if (success) {
      navigate(`/dashboard/ingreso-mercancia/${id}/verificacion`, {
        state: { scannedItems }
      });
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
          <Button 
            variant="outline" 
            className="bg-gray-100"
            onClick={() => navigate('/dashboard/ingreso-mercancia')}
          >
            Regresar
          </Button>
          {ingreso.estado !== 'c' && (
            <>
              <Button 
                variant="outline" 
                className="bg-gray-100"
                onClick={handleSave}
                disabled={scannedItems.length === 0}
              >
                Guardar
              </Button>
              <Button 
                className="bg-ecommerce-500 hover:bg-ecommerce-600"
                onClick={handleCompletar}
                disabled={scannedItems.length === 0}
              >
                Completar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          {/* <div className="flex justify-between">
            <span className="text-gray-600">ID</span>
            <span className="font-medium">{ingreso.ingresomercancia_id}</span>
          </div> */}
          <div className="flex justify-between">
            <span className="text-gray-600">Origen</span>
            <span className="font-medium">{getSourceName(ingreso.source)}</span>
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
              disabled={ingreso.estado === 'c' || ingreso?.es_masiva === 'si'}
            />
          </form>

          <div className="mt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Position</th>
                  <th className="text-left py-2">Cantidad a transferir</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scannedItems.map((item, index) => (
                  <tr key={`${item.sku}-${item.position}`} className="border-b">
                    <td className="py-2">{item.sku}</td>
                    <td className="py-2">{item.position}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedItems = [...scannedItems];
                            if (updatedItems[index].quantity > 1) {
                              updatedItems[index].quantity -= 1;
                              setScannedItems(updatedItems);
                              setTotalScanned(prev => prev - 1);
                            }
                          }}
                          disabled={ingreso.estado === 'c' || ingreso?.es_masiva === 'si'}
                        >
                          -
                        </Button>
                        {item.quantity}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedItems = [...scannedItems];
                            updatedItems[index].quantity += 1;
                            setScannedItems(updatedItems);
                            setTotalScanned(prev => prev + 1);
                          }}
                          disabled={ingreso.estado === 'c'  || ingreso?.es_masiva === 'si'}
                        >
                          +
                        </Button>
                      </div>
                    </td>
                    <td className="py-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.sku, item.position)}
                        disabled={ingreso.estado === 'c' || ingreso?.es_masiva === 'si'}
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresoMercanciaDetalle; 