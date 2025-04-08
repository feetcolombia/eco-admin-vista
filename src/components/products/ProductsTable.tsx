
import React from "react";
import { ChevronDown, ChevronUp, Search, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product, Website, Category } from "@/api/productApi";
import { ProductRowDetails } from "./ProductRowDetails";

interface ProductsTableProps {
  products: Product[];
  expandedRows: number[];
  toggleRow: (productId: number, productSku: string) => void;
  childProducts: { [key: number]: Product[] };
  categories: Category[];
  websites: Website[];
  handleCreateBox: (product: Product) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalCount: number;
  pageSize: number;
  totalPages: number;
}

export const ProductsTable = ({
  products,
  expandedRows,
  toggleRow,
  childProducts,
  categories,
  websites,
  handleCreateBox,
  currentPage,
  setCurrentPage,
  totalCount,
  pageSize,
  totalPages
}: ProductsTableProps) => {
  
  const getAttributeValue = (product: Product, code: string) => {
    const attribute = product.custom_attributes.find(attr => attr.attribute_code === code);
    return attribute ? attribute.value : '';
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>SKU Pai</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Categorias</TableHead>
              <TableHead>Websites</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Estilo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <React.Fragment key={product.id}>
                <TableRow className="hover:bg-gray-50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRow(product.id, product.sku)}
                    >
                      {expandedRows.includes(product.id) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {product.extension_attributes.category_links.length} categorias
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-white">
                        {product.extension_attributes.category_links.map((link) => (
                          <div key={link.category_id} className="px-2 py-1.5 text-sm">
                            {categories.find(cat => cat.id === parseInt(link.category_id))?.name || link.category_id}
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {product.extension_attributes.website_ids.length} websites
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-white">
                        {product.extension_attributes.website_ids.map((websiteId) => (
                          <div key={websiteId} className="px-2 py-1.5 text-sm">
                            {websites.find(site => site.id === websiteId)?.name || websiteId}
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{getAttributeValue(product, 'color')}</TableCell>
                  <TableCell>{getAttributeValue(product, 'material')}</TableCell>
                  <TableCell>{getAttributeValue(product, 'marca')}</TableCell>
                  <TableCell>{getAttributeValue(product, 'estilo')}</TableCell>
                  <TableCell >

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCreateBox(product)}
                    >
                      <Package size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows.includes(product.id) && childProducts[product.id] && (
                  <ProductRowDetails 
                    productId={product.id} 
                    childProducts={childProducts[product.id]} 
                  />
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} produtos
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </>
  );
};
