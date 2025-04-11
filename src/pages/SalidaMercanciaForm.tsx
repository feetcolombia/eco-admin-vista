import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSalidaMercanciaApi } from '@/hooks/useSalidaMercanciaApi';
import { toast } from 'sonner';

interface ProductItem {
  barcode: string;
  sku: string;
  bodega_nombre: string;
  inventory_quantity: number;
  quantity: number;
}

const SalidaMercanciaForm = () => {
  const navigate = useNavigate();
  const { loading, getProductQuantity } = useSalidaMercanciaApi();
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);

  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await handleBarcodeSubmit();
    }
  };

  const handleBarcodeBlur = async () => {
    if (barcode.trim()) {
      await handleBarcodeSubmit();
    }
  };

  const handleBarcodeSubmit = async () => {
    if (!barcode.trim()) return;

    try {
      const response = await getProductQuantity(barcode, 1, 'default'); // bodegaId e source fixos por enquanto
      
      const newProduct: ProductItem = {
        barcode: response.barcode,
        sku: response.sku,
        bodega_nombre: response.bodega_nombre,
        inventory_quantity: response.inventory_quantity,
        quantity: 1
      };

      setProducts(prev => [...prev, newProduct]);
      setBarcode('');
    } catch (error) {
      // O toast de erro já é mostrado no hook
    }
  };

  const handleQuantityChange = (index: number, value: number) => {
    setProducts(prev => {
      const newProducts = [...prev];
      const product = newProducts[index];
      
      if (value > product.inventory_quantity) {
        toast.error('Quantidade não pode ser maior que o estoque');
        return prev;
      }

      if (value < 1) {
        toast.error('Quantidade não pode ser menor que 1');
        return prev;
      }

      product.quantity = value;
      return newProducts;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                onBlur={handleBarcodeBlur}
                placeholder="Digite ou escaneie o código de barras"
                disabled={loading}
              />
            </div>

            {products.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código de Barras</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.bodega_nombre}</TableCell>
                      <TableCell>{product.inventory_quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(index, product.quantity - 1)}
                            disabled={product.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="w-12 text-center">{product.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(index, product.quantity + 1)}
                            disabled={product.quantity >= product.inventory_quantity}
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setProducts(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalidaMercanciaForm; 