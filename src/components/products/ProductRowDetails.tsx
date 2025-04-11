import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "@/api/productApi";

interface ProductRowDetailsProps {
  productId: number;
  childProducts: Product[];
}

export const ProductRowDetails = ({ productId, childProducts }: ProductRowDetailsProps) => {
  return (
    <TableRow key={`details-${productId}`}>
      <TableCell colSpan={12}>
        <div className="pl-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Inventario</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {childProducts.map((child) => (
                <TableRow key={child.id}>
                  <TableCell>{child.sku}</TableCell>
                  <TableCell>{child.name}</TableCell>
                  <TableCell>R$ {child.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${child.is_closedbox ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                      {child.is_closedbox ? 'Caja Cerrada' : 'Unidad'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${child.status === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {child.status === 1 ? 'Activo' : 'Inactivo'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableCell>
    </TableRow>
  );
};
