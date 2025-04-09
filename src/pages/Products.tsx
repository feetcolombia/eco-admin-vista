import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import productApi, { Product, Website, Category } from "@/api/productApi";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductsTable } from "@/components/products/ProductsTable";
import { CreateBoxDialog } from "@/components/CreateBoxDialog";
import { flattenCategories } from "@/utils/categoryUtils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient, getAuthHeaders } from "@/api/apiConfig";

const Products = () => {
  const navigate = useNavigate();
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

  const handleSearch = async () => {
    try {
      setLoading(true);
      
      const searchCriteria: Record<string, string> = {
        'searchCriteria[filter_groups][0][filters][0][field]': 'type_id',
        'searchCriteria[filter_groups][0][filters][0][value]': 'configurable',
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'eq',
        'searchCriteria[currentPage]': currentPage.toString(),
        'searchCriteria[pageSize]': pageSize.toString()
      };

      let filterGroupIndex = 1;

      // Adiciona filtro de SKU se houver
      if (searchQuery) {
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = 'sku';
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = searchQuery;
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = 'eq';
        filterGroupIndex++;
      }

      // Adiciona filtro de website se selecionado
      if (selectedWebsite && selectedWebsite !== 'all') {
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = 'website_id';
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = selectedWebsite;
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = 'eq';
        filterGroupIndex++;
      }

      // Adiciona filtro de categoria se selecionada
      if (selectedCategories.length > 0 && selectedCategories[0] !== 0) {
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][field]`] = 'category_id';
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][value]`] = selectedCategories[0].toString();
        searchCriteria[`searchCriteria[filter_groups][${filterGroupIndex}][filters][0][condition_type]`] = 'eq';
      }

      const response = await apiClient.get('/rest/V1/products', {
        params: searchCriteria,
        headers: getAuthHeaders()
      });

      setProducts(response.data.items);
      setTotalCount(response.data.total_count);
    } catch (error) {
      console.error("Falha ao buscar produtos", error);
      toast.error("Erro ao buscar produtos. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
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

  const handleCreateBox = (product: Product) => {
    setSelectedProduct(product);
    setIsCreateBoxOpen(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos da sua loja
          </p>
        </div>
        <Button 
          className="bg-ecommerce-500 hover:bg-ecommerce-600"
          onClick={() => navigate("/dashboard/products/new")}
        >
          <Plus size={16} className="mr-2" /> Novo Produto
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ProductFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategories={selectedCategories}
            handleCategorySelection={handleCategorySelection}
            categories={categories}
            categoriesLoading={categoriesLoading}
            selectedWebsite={selectedWebsite}
            setSelectedWebsite={setSelectedWebsite}
            websites={websites}
            websitesLoading={websitesLoading}
            onSearch={handleSearch}
          />

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <ProductsTable 
              products={products}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              childProducts={childProducts}
              categories={categories}
              websites={websites}
              handleCreateBox={handleCreateBox}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalCount={totalCount}
              pageSize={pageSize}
              totalPages={totalPages}
            />
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
