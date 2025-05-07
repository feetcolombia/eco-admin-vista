import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Search, Package, Plus, SquarePen } from "lucide-react";
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
import productApi from "@/api/productApi";

interface AttributeOption {
  label: string;
  value: string;
}

interface ProductsTableProps {
  products: Product[];
  expandedRows: number[];
  toggleRow: (productId: number, productSku: string) => void;
  childProducts: { [key: number]: Product[] };
  categories: Category[];
  websites: Website[];
  handleCreateBox: (product: Product) => void;
  handleEditProduct: (product: Product) => void;
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
  handleEditProduct,
  currentPage,
  setCurrentPage,
  totalCount,
  pageSize,
  totalPages
}: ProductsTableProps) => {
  const [marcaOptions, setMarcaOptions] = useState<AttributeOption[]>([]);
  const [colorOptions, setColorOptions] = useState<AttributeOption[]>([]);
  const [materialOptions, setMaterialOptions] = useState<AttributeOption[]>([]);
  const [estiloOptions, setEstiloOptions] = useState<AttributeOption[]>([]);

  useEffect(() => {
    const fetchAttributeOptions = async () => {
      try {
        const [marca, color, material, estilo] = await Promise.all([
          productApi.getMarcaOptions(),
          productApi.getColorOptions(),
          productApi.getMaterialOptions(),
          productApi.getEstiloOptions()
        ]);
        setMarcaOptions(marca);
        setColorOptions(color);
        setMaterialOptions(material);
        setEstiloOptions(estilo);
      } catch (error) {
        console.error('Erro ao buscar opções de atributos:', error);
      }
    };

    fetchAttributeOptions();
  }, []);

  const getAttributeValue = (product: Product, code: string) => {
    const attribute = product.custom_attributes.find(attr => attr.attribute_code === code);
    if (!attribute) return '';
    
    const value = attribute.value;
    if (typeof value !== 'string') return '';

    switch (code) {
      case 'marca':
        return marcaOptions.find(opt => opt.value === value)?.label || value;
      case 'color':
        return colorOptions.find(opt => opt.value === value)?.label || value;
      case 'material':
        return materialOptions.find(opt => opt.value === value)?.label || value;
      case 'estilo':
        return estiloOptions.find(opt => opt.value === value)?.label || value;
      default:
        return value;
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>SKU Padre</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Categorías</TableHead>
              <TableHead>Sitios Web</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Estilo</TableHead>
              <TableHead>Acciones</TableHead>
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
                          {product.extension_attributes.category_links.length} categorías
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
                          {product.extension_attributes.website_ids.length} sitios web
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
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCreateBox(product)}
                      >
                        <Package size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(product)}
                      >
                        <SquarePen size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedRows.includes(product.id) && childProducts[product.id] && (
                  <ProductRowDetails 
                    productId={product.id} 
                    childProducts={childProducts[product.id]}
                    handleEditProduct={handleEditProduct}
                  />
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} productos
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
            Siguiente
          </Button>
        </div>
      </div>
    </>
  );
};
