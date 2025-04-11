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
  productos?: {
    salida_mercancia_producto_id: string;
    salida_mercancia_id: string;
    producto: string;
    sku: string;
    cantidad: string;
    bodega_id: string;
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
  inventory_quantity: number;
  quantity: number;
}

const SalidaMercanciaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [salida, setSalida] = useState<SalidaMercancia | null>(null);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [selectedBodegaId, setSelectedBodegaId] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [totalScanned, setTotalScanned] = useState(0);
  const [products, setProducts] = useState<ProductItem[]>([]);

  const { loading, getSalidaById, getBodegas, getProductQuantity, saveProducts } = useSalidaMercanciaApi();

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
    if (!id || isNaN(Number(id))) return;
    const data = await getSalidaById(Number(id));
    if (data) {
      setSalida(data);
      if (data.productos && data.productos.length > 0) {
        const existingProducts = data.productos.map(product => ({
          barcode: product.sku,
          sku: product.sku,
          bodega_nombre: product.bodega_nombre,
          inventory_quantity: parseInt(product.cantidad),
          quantity: parseInt(product.cantidad)
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

  const handleBodegaChange = (bodegaNombre: string) => {
    setSelectedBodega(bodegaNombre);
    const bodega = bodegas.find(b => b.bodega_nombre === bodegaNombre);
    if (bodega) {
      setSelectedBodegaId(bodega.bodega_id);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim() || !selectedBodegaId) return;

    try {
      const response = await getProductQuantity(barcode, selectedBodegaId, salida?.source || 'default');
      
      const newProduct: ProductItem = {
        barcode: response.barcode,
        sku: response.sku,
        bodega_nombre: response.bodega_nombre,
        inventory_quantity: response.transferencia_quantity,
        quantity: 1
      };

      setProducts(prev => [...prev, newProduct]);
      setBarcode('');
      setTotalScanned(prev => prev + 1);
    } catch (error) {
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
        salidaMercanciaProductos: products.map(product => ({
          salida_mercancia_id: Number(id),
          sku: product.sku,
          cantidad: product.quantity,
          bodega_id: selectedBodegaId
        }))
      };

      await saveProducts(payload);
      // Limpa a lista de produtos após salvar com sucesso
      setProducts([]);
      setTotalScanned(0);
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
      // Primeiro salvamos os produtos
      const payload = {
        salidaMercanciaProductos: products.map(product => ({
          salida_mercancia_id: Number(id),
          sku: product.sku,
          cantidad: product.quantity,
          bodega_id: selectedBodegaId
        }))
      };

      await saveProducts(payload);
      // Após salvar com sucesso, navegamos para a página de confirmação
      navigate(`/dashboard/salida-mercancia/${id}/confirmar`);
    } catch (error) {
      // O toast de erro já é mostrado no hook
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
          <Button variant="outline" className="bg-gray-100">
            Volver
          </Button>
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">ID</span>
            <span className="font-medium">{salida.salidamercancia_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Origen</span>
            <span className="font-medium">{salida.source}</span>
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
                />
              </div>
              <div className="w-48">
                <Select value={selectedBodega} onValueChange={handleBodegaChange}>
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
              placeholder="Escanear o digitar código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  await handleBarcodeSubmit(e);
                }
              }}
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
                  <th className="text-left py-2">Disponível</th>
                  <th className="text-left py-2">Quantidade</th>
                  <th className="text-left py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{product.sku}</td>
                    <td className="py-2">{product.bodega_nombre}</td>
                    <td className="py-2">{product.inventory_quantity}</td>
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
                          disabled={product.quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => {
                            const newQuantity = Math.min(
                              Math.max(1, parseInt(e.target.value) || 0),
                              product.inventory_quantity
                            );
                            setProducts(prev => prev.map((p, i) => 
                              i === index ? { ...p, quantity: newQuantity } : p
                            ));
                          }}
                          className="w-20 text-center"
                          min={1}
                          max={product.inventory_quantity}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newQuantity = Math.min(product.inventory_quantity, product.quantity + 1);
                            setProducts(prev => prev.map((p, i) => 
                              i === index ? { ...p, quantity: newQuantity } : p
                            ));
                          }}
                          disabled={product.quantity >= product.inventory_quantity}
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