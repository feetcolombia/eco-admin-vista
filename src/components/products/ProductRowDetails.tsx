import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "@/api/productApi";
import { Button } from "@/components/ui/button";
import { SquarePen, Box, ShoppingBag } from "lucide-react";

interface ProductRowDetailsProps {
  productId: number;
  childProducts: Product[];
  handleEditProduct: (product: Product) => void;
}

export const ProductRowDetails = ({ productId, childProducts, handleEditProduct }: ProductRowDetailsProps) => {
  return (
    <TableRow>
      <TableCell colSpan={12}>
        <div className="pl-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Código de Barras</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Inventario</TableHead>
                <TableHead>Qtd. Vendável</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {childProducts.map((child) => {
                let barcode = 'N/A';
                if (child.extension_attributes?.os_barcode_data && child.extension_attributes.os_barcode_data.length > 0) {
                  try {
                    const barcodeData = JSON.parse(child.extension_attributes.os_barcode_data[0]);
                    barcode = barcodeData.barcode || 'N/A';
                  } catch (e) {
                    console.error("Erro ao fazer parse dos dados do código de barras:", e);
                  }
                }

                let totalSalableQuantity = 0;
                let sourceDescriptions = [];
                if (child.extension_attributes?.source_stock_data && child.extension_attributes.source_stock_data.length > 0) {
                  for (const sourceStr of child.extension_attributes.source_stock_data) {
                    try {
                      const sourceData = JSON.parse(sourceStr);
                      totalSalableQuantity += sourceData.salable_quantity || 0;
                      if (sourceData.description) {
                        sourceDescriptions.push(sourceData.description);
                      }
                    } catch (e) {
                      console.error("Erro ao fazer parse dos dados da fonte de estoque:", e);
                    }
                  }
                }

                return (
                  <TableRow key={child.id}>
                    <TableCell>{child.sku}</TableCell>
                    <TableCell>{child.name}</TableCell>
                    <TableCell>{barcode}</TableCell>
                    <TableCell>$ {child.price.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${child.is_closedbox ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        {child.is_closedbox ? (
                          <>
                            <Box size={16} className="mr-1" />
                            Módulo
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={16} className="mr-1" />
                            Unidad
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{totalSalableQuantity > 0 ? totalSalableQuantity : 'N/A'}</TableCell>
                    <TableCell>{sourceDescriptions.length > 0 ? sourceDescriptions.join(', ') : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${child.status === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {child.status === 1 ? 'Activo' : 'Inactivo'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(child)}
                      >
                        <SquarePen size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TableCell>
    </TableRow>
  );
};
