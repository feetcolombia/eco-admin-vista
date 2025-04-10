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

const IngresoMercanciaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ingreso, setIngreso] = useState<IngresoMercancia | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [totalScanned, setTotalScanned] = useState(0);

  const { loading, getIngresoById, getBodegas, getBarcodeData, saveIngresoMercanciaProductos } = useIngresoMercanciaApi();

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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode && selectedBodega) {
      const barcodeData = await getBarcodeData(barcode);
      
      if (barcodeData) {
        const existingItemIndex = scannedItems.findIndex(
          item => item.sku === barcodeData.product_sku && item.position === selectedBodega
        );

        if (existingItemIndex >= 0) {
          // Se já existe um item com mesmo SKU e posição, incrementa a quantidade
          const updatedItems = [...scannedItems];
          updatedItems[existingItemIndex].quantity += 1;
          setScannedItems(updatedItems);
        } else {
          // Se não existe, adiciona novo item
          setScannedItems([
            ...scannedItems,
            {
              sku: barcodeData.product_sku,
              position: selectedBodega,
              quantity: 1
            }
          ]);
        }

        if (soundEnabled) {
          // Reproduz um som de beep
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQgZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BdGAg+ltrzxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1oU2Bhxqvu3mnEoPDlOq5O+zYRsGPJPY88p3KgUme8rx3I4+CRVht+rqpVITC0mh4PG9aB8GMojU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYGK4DN8tiIOQgZZ7vs559NEAxPqOPxtmQcBjiP1/PMeS0FI3fH8N+RQAoUXrTp66hWFApGnt/yv2wiBTCG0fPTgzQHHG3A7eSaSA0PVqzl77BdGAk9ltnzxnUoBSh+y/HajDsIF2W56+mjUREKTKPi8blnHgU1jdTy0HwvBSF0xPDglEQKElux6OyrWRUJQ5vd88FwJAQug8/y1oY2Bhxqvu3mnEwODVKp5e+zYRsGOpPY88p3KgUmecnw3Y4/CBVgtuvqpVQSCkig4PG9aiAFMofS89GBMgUfccLv45ZGDRBYrufur1wYB0CX2/PEcycFKn/M8tiKOggZZ7vs559PEAxPpuPxt2UeBTeP1/POei4FI3bH8d+RQQkUXbPq66hWFApGnt/yv2wiBTCG0PPTgzUGHG3A7eSaSA0PVKzl77BeGQc9ltnzyHYpBSh9y/HajD0JFmS46+mjUREKTKPi8blnHwU1jdTy0H4wBiF0xPDglUUKElux6OyrWhUJQ5vd88NxJAQug8/y2IY3BxtnvO3mnU0ODVKp5e+0YhsGOpHY88p5LAUlecnw3Y9ACBVgtuvqp1QSCkif4PG9bCEFMofR89GBMwYdccLv45dHDRBXr+fur10YB0CX2/PGcycFKn/M8tiKOggZZrvs559PEAxPpuPxt2UeBTeP1/POei4FI3bH8d+RQQsUXbPq66pXFQlFnt/yv24iBTCF0PPThDYGHG3A7eSbSQ0PVKvl77BfGQc9ltnzyHYqBSh9y/HajD0JFmS46+mjUhEKTKPi8blnHwU1jdTy0H4wBiFzw/DglUUKElqw6OyrWhUJQprd88NxJQQug8/y2IY4BxtnvO3mnU4ODVKo5PC0YxsGOpHY88p5LAUleMnw3Y9ACBVgtuvqp1QSCkif4PG9bCEFMofR89GBMwYdccLv45dHDRBXr+fur10YCECWAABJTklGSVhJTkc=');
          audio.play();
        }

        setTotalScanned(prev => prev + 1);
        setBarcode("");
      }
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
      if (!bodega) throw new Error(`Bodega não encontrada: ${item.position}`);

      return {
        ingreso_mercancia_id: ingreso.ingresomercancia_id,
        sku: item.sku,
        cantidad: item.quantity,
        bodega_id: bodega.bodega_id.toString()
      };
    });

    const success = await saveIngresoMercanciaProductos(productos);
    if (success) {
      navigate('/dashboard/ingreso-mercancia');
    }
  };

  const handleCompletar = () => {
    if (scannedItems.length === 0) return;
    
    navigate(`/dashboard/ingreso-mercancia/${id}/verificacion`, {
      state: { scannedItems }
    });
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