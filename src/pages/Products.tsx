
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Search, Package, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import productApi, { Product, Website, Category } from "@/api/productApi";
import { CreateBoxDialog } from "@/components/CreateBoxDialog";

// Helper function to flatten the category tree for easier display
const flattenCategories = (category: Category, categories: Category[] = []): Category[] => {
  categories.push(category);
  
  if (category.children_data && category.children_data.length > 0) {
    category.children_data.forEach(child => {
      flattenCategories(child, categories);
    });
  }
  
  return categories;
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [childProducts, setChildProducts] = useState<{ [key: number]: Product[] }>({});
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateBoxOpen, setIsCreateBoxOpen] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [websitesLoading, setWebsitesLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productApi.getProducts(currentPage, pageSize);
        setProducts(response.items);
        setTotalCount(response.total_count);
      } catch (error) {
        console.error("Falha ao buscar produtos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage]);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const data = await productApi.getWebsites();
        setWebsites(data);
      } catch (error) {
        console.error("Falha ao buscar websites", error);
      } finally {
        setWebsitesLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const data = await productApi.getCategories();
        // Flatten the category tree for easier display in dropdown
        const flatCategories = flattenCategories(data).filter(cat => cat.level > 1); // Skip root category
        setCategories(flatCategories);
      } catch (error) {
        console.error("Falha ao buscar categorias", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchWebsites();
    fetchCategories();
  }, []);

  const getAttributeValue = (product: Product, code: string) => {
    const attribute = product.custom_attributes.find(attr => attr.attribute_code === code);
    return attribute ? attribute.value : '';
  };

  const toggleRow = async (productId: number, productSku: string) => {
    if (expandedRows.includes(productId)) {
      setExpandedRows(expandedRows.filter(id => id !== productId));
    } else {
      setExpandedRows([...expandedRows, productId]);
      
      // Buscar produtos filhos se ainda não foram carregados
      if (!childProducts[productId]) {
        try {
          const children = await productApi.getProductChildren(productSku);
          setChildProducts({
            ...childProducts,
            [productId]: children
          });
        } catch (error) {
          console.error("Falha ao buscar produtos filhos", error);
        }
      }
    }
  };

  const handleCategorySelection = (categoryId: number) => {
    setSelectedCategories(current =>
      current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId]
    );
  };

  const getCategoryNameById = (categoryId: number): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  const getWebsiteNameById = (websiteId: number): string => {
    const website = websites.find(site => site.id === websiteId);
    return website ? website.name : '';
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleCreateBox = (product: Product) => {
    setSelectedProduct(product);
    setIsCreateBoxOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos da sua loja
          </p>
        </div>
        <Button className="bg-ecommerce-500 hover:bg-ecommerce-600">
          <Plus size={16} className="mr-2" /> Novo Produto
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex justify-between items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Buscar produtos..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="min-w-[220px]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedCategories.length === 0 
                        ? "Categorias" 
                        : `${selectedCategories.length} selecionadas`}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white">
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="w-5 h-5 border-2 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      categories.map((category) => (
                        <DropdownMenuCheckboxItem
                          key={category.id}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategorySelection(category.id)}
                          className={`pl-${category.level * 2}`}
                        >
                          {category.name}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="min-w-[220px]">
                <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Websites" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {websitesLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="w-5 h-5 border-2 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      websites.map((website) => (
                        <SelectItem key={website.id} value={website.id.toString()}>
                          {website.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
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
                      <TableHead>Tipo de Curva</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <>
                        <TableRow key={product.id} className="hover:bg-gray-50">
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
                          <TableCell></TableCell>
                          <TableCell className="space-x-2">
                            <Button variant="ghost" size="icon">
                              <Search size={16} />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Plus size={16} />
                            </Button>
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
                          <TableRow>
                            <TableCell colSpan={12}>
                              <div className="pl-8">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>SKU</TableHead>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Preço</TableHead>
                                      <TableHead>Estoque</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {childProducts[product.id].map((child) => (
                                      <TableRow key={child.id}>
                                        <TableCell>{child.sku}</TableCell>
                                        <TableCell>{child.name}</TableCell>
                                        <TableCell>R$ {child.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center">
                                            <span className={`w-2 h-2 rounded-full mr-2 ${child.is_closedbox ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                            {child.is_closedbox ? 'Caixa Fechada' : 'Unidade'}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center">
                                            <span className={`w-2 h-2 rounded-full mr-2 ${child.status === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {child.status === 1 ? 'Ativo' : 'Inativo'}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedProduct && (
        <CreateBoxDialog
          open={isCreateBoxOpen}
          onClose={() => {
            setIsCreateBoxOpen(false);
            setSelectedProduct(null);
          }}
          parentProduct={selectedProduct}
        />
      )}
    </div>
  );
};

export default Products;
