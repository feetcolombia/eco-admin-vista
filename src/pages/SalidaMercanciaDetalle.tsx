import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { toast } from "sonner";

interface SalidaMercancia {
  salidamercancia_id: number;
  source: string;
  creador: number;
  fecha: string;
  consecutivo: string;
  estado: string;
  descripcion: string;
  nombre_responsable: string;
  es_masiva?: string;
  productos?: {
    salida_mercancia_producto_id: string;
    salida_mercancia_id: string;
    producto: string;
    sku: string;
    cantidad: string;
    bodega_id: string;
    cantidad_disponible: number; 
    bodega_nombre: string;
  }[];
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

interface ProductItem {
  barcode: string;
  sku: string;
  bodega_nombre: string;
  transferencia_quantity: number;
  cantidad_disponible: number;
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

const SalidaMercanciaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [salida, setSalida] = useState<SalidaMercancia | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [selectedBodegaId, setSelectedBodegaId] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [barcode, setBarcode] = useState("");
  const [totalScanned, setTotalScanned] = useState(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  const { loading, getSalidaById, getBodegas, getProductQuantity, saveProducts, getSources } = useSalidaMercanciaApi();

  useEffect(() => {
    if (id) {
      fetchSalida();
      fetchSources();
    }
  }, [id]);

  useEffect(() => {
    if (salida?.source) {
      fetchBodegas();
    }
  }, [salida?.source]);

  const fetchSalida = async () => {
    if (!id || isNaN(Number(id))) return;
    const data = await getSalidaById(Number(id));
    if (data) {
      const transformedData = {
        ...data,
        productos: data.productos
          ? data.productos.map(product => ({
              ...product,
              cantidad_disponible: product.cantidad_disponible ? parseInt(product.cantidad_disponible) : 0
            }))
          : []
      };
      setSalida(transformedData);
      if (transformedData.productos && transformedData.productos.length > 0) {
        const existingProducts = transformedData.productos.map(product => ({
          barcode: product.sku,
          sku: product.sku,
          bodega_nombre: product.bodega_nombre,
          transferencia_quantity: parseInt(product.cantidad),
          quantity: parseInt(product.cantidad),
          cantidad_disponible: product.cantidad_disponible
        }));
        setProducts(existingProducts);
        setTotalScanned(existingProducts.length);
      }
    }
  };

  const fetchBodegas = async () => {
    if (salida?.source) {
      const data = await getBodegas(salida.source);
      setBodegas(data);
      if (data.length > 0) {
        setSelectedBodega(data[0].bodega_nombre);
        setSelectedBodegaId(data[0].bodega_id);
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

  const handleBodegaChange = (bodegaNombre: string) => {
    setSelectedBodega(bodegaNombre);
    const bodega = bodegas.find(b => b.bodega_nombre === bodegaNombre);
    if (bodega) {
      setSelectedBodegaId(bodega.bodega_id);
    }
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
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      
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
    if (!barcode.trim() || !selectedBodegaId) return;

    try {
      const response = await getProductQuantity(barcode, selectedBodegaId, salida?.source || 'default');
      
      // Verificar se o produto já existe com o mesmo SKU e mesma bodega
      const existingProductIndex = products.findIndex(
        p => p.sku === response.sku && p.bodega_nombre === response.bodega_nombre
      );

      if (existingProductIndex !== -1) {
        // Se o produto já existe, apenas incrementa a quantidade
        const existingProduct = products[existingProductIndex];
        const newQuantity = Math.min(
          existingProduct.quantity + 1,
          response.transferencia_quantity
        );

        setProducts(prev => prev.map((product, index) => {
          if (index === existingProductIndex) {
            return { ...product, transferencia_quantity: response.transferencia_quantity, quantity: newQuantity };
          }
          return product;
        }));

        if (newQuantity === response.transferencia_quantity && existingProduct.quantity < response.transferencia_quantity) {
          playBeep(false); // Atingiu o limite
        } else {
          playBeep(true); // Incremento bem-sucedido
        }
      } else {
        // Se o produto não existe, adiciona como novo
        const newProduct: ProductItem = {
          barcode: response.barcode,
          sku: response.sku,
          bodega_nombre: response.bodega_nombre,
          transferencia_quantity: response.transferencia_quantity,
          quantity: 1
        };
        setProducts(prev => [...prev, newProduct]);
        setTotalScanned(prev => prev + 1);

        playBeep(true);
      }
      
      setBarcode('');
    } catch (error) {
      playBeep(false);
      // O toast de erro já é mostrado no hook
    }
  };

  const handleSaveProducts = async () => {
    if (!id || products.length === 0) {
      toast.error('Agregue productos antes de salvar');
      return;
    }

    try {
    const payload = {
        salidaMercanciaProductos: products.map(product => {
          const bodegaMatch = bodegas.find(b => b.bodega_nombre === product.bodega_nombre);
          return {
            salida_mercancia_id: Number(id),
            sku: product.sku,
            cantidad: product.quantity,
            bodega_id: bodegaMatch ? bodegaMatch.bodega_id : selectedBodegaId
          };
        })
      };

      await saveProducts(payload);
      // Limpa a lista de productos y recarga los datos de salida
      setProducts([]);
      setTotalScanned(0);
      await fetchSalida();
      toast.success("Productos guardados y datos actualizados");
    } catch (error) {
      // O toast de erro já é mostrado no hook
    }
  };

  const handleCompletarSalida = async () => {
    if (!id || products.length === 0) {
      toast.error('Agregue productos antes de completar');
      return;
    }
    try {
      // Primero salvamos los productos con bodega_id de cada registro
      const payload = {
        salidaMercanciaProductos: products.map(product => {
          const bodegaMatch = bodegas.find(b => b.bodega_nombre === product.bodega_nombre);
          return {
            salida_mercancia_id: Number(id),
            sku: product.sku,
            cantidad: product.quantity,
            bodega_id: bodegaMatch ? bodegaMatch.bodega_id : selectedBodegaId
          };
        })
      };

      await saveProducts(payload);
      // Después de guardar con éxito, navegamos a la página de confirmación
      navigate(`/dashboard/salida-mercancia/${id}/confirmar`);
    } catch (error) {
      // El toast de error ya es mostrado en el hook
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
          <h1 className="text-2xl font-bold">Ejecutar Proceso de Salida</h1>
        </div>
              <div className="flex gap-2">
          <Button variant="outline" className="bg-gray-100" onClick={() => navigate('/dashboard/salida-mercancia')}>
            Volver
          </Button>
          {salida?.estado !== 'c' && (
            <>
              <Button 
                variant="outline" 
                className="bg-gray-100"
                onClick={handleSaveProducts}
                disabled={loading || products.length === 0}
              >
                Guardar
              </Button>
              <Button 
                className="bg-ecommerce-500 hover:bg-ecommerce-600"
                onClick={handleCompletarSalida}
                disabled={loading || products.length === 0}
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
            <span className="font-medium">{salida.salidamercancia_id}</span>
          </div> */}
          <div className="flex justify-between">
            <span className="text-gray-600">Origen</span>
            <span className="font-medium">{getSourceName(salida.source)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Usuario Responsable</span>
            <span className="font-medium">{salida.nombre_responsable}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Consecutivo</span>
            <span className="font-medium">{salida.consecutivo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha</span>
            <span className="font-medium">
              {format(new Date(salida.fecha), "dd/MM/yyyy")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estado</span>
            <span className="font-medium">
              {salida.estado === 'n' ? 'Nuevo' : salida.estado === 'p' ? 'En Proceso' : 'Completado'}
            </span>
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
                  disabled={salida?.estado === 'c'}
                />
              </div>
              <div className="w-48">
                <Select value={selectedBodega} onValueChange={handleBodegaChange} disabled={salida?.estado === 'c'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione la posición" />
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
              placeholder="Escanear o digitar código de barras o Sku del producto"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  await handleBarcodeSubmit(e);
                }
              }}
              className="w-full"
              autoFocus
              disabled={salida?.estado === 'c'}
            />
          </form>

          <div className="mt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Posición</th>
                  <th className="text-left py-2">Cantidad Disponible</th>
                  <th className="text-left py-2">Cantidad a Transferir</th>
                  <th className="text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{product.sku}</td>
                    <td className="py-2">{product.bodega_nombre}</td>
                    <td className="py-2">{product.cantidad_disponible}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newQuantity = Math.max(1, product.quantity - 1);
                            setProducts(prev => prev.map((p, i) => 
                              i === index ? { ...p, quantity: newQuantity } : p
                            ));
                          }}
                          disabled={product.quantity <= 1 || salida?.estado === 'c'}
                        >
                          -
                        </Button>
                        <Input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => {
                              const newQuantity = Math.min(
                                Math.max(1, parseInt(e.target.value) || 0),
                                product.cantidad_disponible
                              );
                              setProducts(prev =>
                                prev.map((p, i) => (i === index ? { ...p, quantity: newQuantity } : p))
                              );
                            }}
                            className="w-20 text-center"
                            min={1}
                            max={product.cantidad_disponible}
                            disabled={salida?.estado === 'c'}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newQuantity = Math.min(product.cantidad_disponible, product.quantity + 1);
                              setProducts(prev =>
                                prev.map((p, i) => (i === index ? { ...p, quantity: newQuantity } : p))
                              );
                              if (newQuantity === product.cantidad_disponible && product.quantity < newQuantity) {
                                playBeep(false);
                              } else {
                                playBeep(true);
                              }
                            }}
                            disabled={product.quantity >= product.cantidad_disponible || salida?.estado === 'c'}
                                                  >
                          +
                        </Button>
                      </div>
                    </td>
                    <td className="py-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setProducts(prev => prev.filter((_, i) => i !== index));
                          setTotalScanned(prev => prev - 1);
                        }}
                        disabled={salida?.estado === 'c'}
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

export default SalidaMercanciaDetalle; 