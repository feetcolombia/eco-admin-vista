import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, getAuthHeaders } from "@/api/apiConfig";
import { Website } from "@/api/types/productTypes";
import { toast } from "sonner";

interface AttributeOption {
  label: string;
  value: string;
}

interface Curva {
  id: string;
  value: string;
}

interface CurvaDetalhe {
  curva_producto_talla_id: string;
  curva_producto_id: string;
  talla: string;
}

interface CurvaResponse {
  id: string;
  nome: string;
  descricao: string;
  tallas: CurvaDetalhe[];
}

interface Category {
  id: number;
  name: string;
  level: number;
  children_data?: Category[];
}

interface TallaOption {
  value_index: number;
}

const NewProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [colors, setColors] = useState<AttributeOption[]>([]);
  const [materials, setMaterials] = useState<AttributeOption[]>([]);
  const [brands, setBrands] = useState<AttributeOption[]>([]);
  const [styles, setStyles] = useState<AttributeOption[]>([]);
  const [curvas, setCurvas] = useState<Curva[]>([]);
  const [curvaDetalhe, setCurvaDetalhe] = useState<CurvaResponse | null>(null);
  const [childSkus, setChildSkus] = useState<Array<{
    sku: string;
    talla: string;
    barcode: string;
  }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    price: "",
    category: "",
    website: "",
    color: "",
    material: "",
    brand: "",
    style: "",
    curva: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch websites
        const websitesResponse = await apiClient.get<Website[]>('/rest/V1/store/websites', {
          headers: getAuthHeaders()
        });
        setWebsites(websitesResponse.data);

        // Fetch categories
        setCategoriesLoading(true);
        const categoriesResponse = await apiClient.get<Category>('/rest/V1/categories', {
          headers: getAuthHeaders()
        });
        
        // Transforma a resposta em um array de categorias
        const categoriesArray: Category[] = [];
        const processCategories = (category: Category) => {
          if (category.level === 3 && category.id && category.name) { // Apenas categorias de nível 3 com id e nome válidos
            categoriesArray.push({
              id: category.id,
              name: category.name,
              level: category.level
            });
          }
          if (category.children_data && category.children_data.length > 0) {
            category.children_data.forEach(processCategories);
          }
        };
        
        processCategories(categoriesResponse.data);
        setCategories(categoriesArray);

        // Fetch attributes
        const [colorsResponse, materialsResponse, brandsResponse, stylesResponse] = await Promise.all([
          apiClient.get<AttributeOption[]>('/rest/V1/products/attributes/color/options', { headers: getAuthHeaders() }),
          apiClient.get<AttributeOption[]>('/rest/V1/products/attributes/material/options', { headers: getAuthHeaders() }),
          apiClient.get<AttributeOption[]>('/rest/V1/products/attributes/marca/options', { headers: getAuthHeaders() }),
          apiClient.get<AttributeOption[]>('/rest/V1/products/attributes/estilo/options', { headers: getAuthHeaders() })
        ]);

        // Filtra itens com valores vazios
        setColors(colorsResponse.data.filter(color => color.value && color.label));
        setMaterials(materialsResponse.data.filter(material => material.value && material.label));
        setBrands(brandsResponse.data.filter(brand => brand.value && brand.label));
        setStyles(stylesResponse.data.filter(style => style.value && style.label));

        // Fetch curvas
        const curvasResponse = await apiClient.get<Curva[]>('/rest/V1/feetproductos-curva/curvas', {
          headers: getAuthHeaders()
        });
        setCurvas(curvasResponse.data.filter(curva => curva.id && curva.value));

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
        setCategoriesLoading(false);
      }
    };

    fetchData();
  }, []);

  // Função para gerar o código de barras
  const generateBarcode = (sku: string, talla: string) => {
    // Remove caracteres especiais do SKU
    const cleanSku = sku.replace(/[^0-9]/g, '');
    // Adiciona zeros à esquerda se necessário
    const paddedTalla = talla.padStart(2, '0');
    return `${cleanSku}${paddedTalla}0000`;
  };

  // Função para gerar SKUs filhos
  const generateChildSkus = (parentSku: string, tallas: CurvaDetalhe[]) => {
    if (!parentSku || !tallas) return;

    const newChildSkus = tallas.map(talla => ({
      sku: `${parentSku}-${talla.talla}`,
      talla: talla.talla,
      barcode: generateBarcode(parentSku, talla.talla)
    }));

    setChildSkus(newChildSkus);
  };

  const handleCurvaChange = async (curvaId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<[string, string, string, CurvaDetalhe[]]>(`/rest/V1/feetproductos-curva/curva/${curvaId}`, {
        headers: getAuthHeaders()
      });

      const [id, nome, descricao, tallas] = response.data;
      const curvaDetalhes = {
        id,
        nome,
        descricao,
        tallas
      };
      setCurvaDetalhe(curvaDetalhes);

      setFormData(prev => ({
        ...prev,
        curva: curvaId
      }));

      // Gera os SKUs filhos se já houver um SKU pai
      if (formData.sku) {
        generateChildSkus(formData.sku, tallas);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes da curva:", error);
      toast.error("Erro ao buscar detalhes da curva. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Atualiza o handler do SKU
  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSku = e.target.value;
    setFormData(prev => ({ ...prev, sku: newSku }));
    
    // Gera os SKUs filhos se houver uma curva selecionada
    if (curvaDetalhe?.tallas) {
      generateChildSkus(newSku, curvaDetalhe.tallas);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!curvaDetalhe) {
        toast.error("Por favor, selecione uma curva válida.");
        return;
      }

      // 1. Cadastrar produto pai (configurable)
      const parentProductData = {
        product: {
          sku: formData.sku,
          name: formData.name,
          attribute_set_id: 4,
          type_id: "configurable",
          visibility: 4,
          status: 1,
          price: parseFloat(formData.price),
          weight: 1,
          extension_attributes: {
            website_ids: [parseInt(formData.website)],
            category_links: [
              {
                position: 0,
                category_id: formData.category
              }
            ],
            configurable_product_options: [
              {
                attribute_id: "200", // ID do atributo talla
                label: "Talla",
                position: 0,
                values: curvaDetalhe.tallas.map(talla => ({
                  value_index: parseInt(talla.talla)
                }))
              }
            ]
          },
          custom_attributes: [
            {
              attribute_code: "color",
              value: formData.color
            },
            {
              attribute_code: "material",
              value: formData.material
            },
            {
              attribute_code: "marca",
              value: formData.brand
            },
            {
              attribute_code: "estilo",
              value: formData.style
            },
            {
              attribute_code: "tax_class_id",
              value: "2"
            },
            {
              attribute_code: "url_key",
              value: formData.sku
            }
          ]
        }
      };

      // Cadastra o produto pai
      await apiClient.post('/rest/V1/products', parentProductData, {
        headers: getAuthHeaders()
      });

      // 2. Cadastrar produtos filhos
      for (const childSku of childSkus) {
        const childProductData = {
          product: {
            sku: childSku.sku,
            name: childSku.sku,
            price: parseFloat(formData.price),
            status: 1,
            visibility: 1,
            type_id: "simple",
            attribute_set_id: 4,
            weight: 1,
            custom_attributes: [
              {
                attribute_code: "talla",
                value: childSku.talla
              }
            ]
          }
        };

        // Cadastra o produto filho
        await apiClient.post('/rest/V1/products', childProductData, {
          headers: getAuthHeaders()
        });

        // 3. Vincula o produto filho ao pai
        await apiClient.post(
          `/rest/V1/configurable-products/${formData.sku}/child`,
          { childSku: childSku.sku },
          { headers: getAuthHeaders() }
        );
      }

      toast.success("Produto cadastrado com sucesso!");
      navigate("/dashboard/products");
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      toast.error("Erro ao cadastrar produto. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground">
            Cadastre um novo produto no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU Padre</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={handleSkuChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Carregando categorias..." : "Selecione uma categoria"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Select
                  value={formData.website}
                  onValueChange={(value) => setFormData({ ...formData, website: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um website" />
                  </SelectTrigger>
                  <SelectContent>
                    {websites.map((website) => (
                      <SelectItem key={website.id} value={website.id.toString()}>
                        {website.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => setFormData({ ...formData, material: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.value} value={material.value}>
                        {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => setFormData({ ...formData, brand: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.value} value={brand.value}>
                        {brand.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Estilo</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value) => setFormData({ ...formData, style: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="curva">Tipo de Curva</Label>
                <Select
                  value={formData.curva}
                  onValueChange={handleCurvaChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo de curva" />
                  </SelectTrigger>
                  <SelectContent>
                    {curvas.map((curva) => (
                      <SelectItem key={curva.id} value={curva.id}>
                        {curva.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {curvaDetalhe && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Nome: {curvaDetalhe.nome}</p>
                    <p>Descrição: {curvaDetalhe.descricao}</p>
                    <p>Tallas disponíveis: {curvaDetalhe.tallas.map(t => t.talla).join(", ")}</p>
                  </div>
                )}
              </div>
            </div>

            {childSkus.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">SKUs Hijo</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {childSkus.map((childSku) => (
                    <Card key={childSku.sku}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div>
                            <Label>Talla {childSku.talla}</Label>
                            <div className="text-sm font-medium">{childSku.sku}</div>
                          </div>
                          <div>
                            <Label>Código de Barras</Label>
                            <div className="text-sm font-mono">{childSku.barcode}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-ecommerce-500 hover:bg-ecommerce-600">
                Salvar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProduct; 