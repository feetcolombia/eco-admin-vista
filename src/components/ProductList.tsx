import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  sku: string;
  barcode: string;
  quantity: number;
  inventory_quantity: number;
  bodega_nombre?: string;
}

interface ProductListProps {
  products: Product[];
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  showBodega?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onQuantityChange,
  onRemove,
  showBodega = false
}) => {
  const handleQuantityChange = (id: string, value: string) => {
    const quantity = parseInt(value) || 0;
    onQuantityChange(id, quantity);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Código de Barras</TableHead>
          {showBodega && <TableHead>Bodega</TableHead>}
          <TableHead>Quantidade</TableHead>
          <TableHead>Estoque</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>{product.sku}</TableCell>
            <TableCell>{product.barcode}</TableCell>
            {showBodega && <TableCell>{product.bodega_nombre}</TableCell>}
            <TableCell>
              <Input
                type="number"
                min="1"
                max={product.inventory_quantity}
                value={product.quantity}
                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                className="w-20"
              />
            </TableCell>
            <TableCell>{product.inventory_quantity}</TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(product.id)}
              >
                Remover
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}; 