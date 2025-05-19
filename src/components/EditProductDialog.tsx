import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, Website, Category } from "@/api/productApi";
import { apiClient, getAuthHeaders } from "@/api/apiConfig";
import { toast } from "sonner";

interface EditProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export function EditProductDialog({ open, onClose, product, onSuccess }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    color: "",
    material: "",
    marca: "",
    estilo: "",
  });

  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colorOptions, setColorOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [materialOptions, setMaterialOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [marcaOptions, setMarcaOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [estiloOptions, setEstiloOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar opções
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [colorData, materialData, marcaData, estiloData] = await Promise.all([
          apiClient.get('/rest/V1/products/attributes/color/options', { headers: getAuthHeaders() }),
          apiClient.get('/rest/V1/products/attributes/material/options', { headers: getAuthHeaders() }),
          apiClient.get('/rest/V1/products/attributes/marca/options', { headers: getAuthHeaders() }),
          apiClient.get('/rest/V1/products/attributes/estilo/options', { headers: getAuthHeaders() })
        ]);

        setColorOptions(colorData.data);
        setMaterialOptions(materialData.data);
        setMarcaOptions(marcaData.data);
        setEstiloOptions(estiloData.data);
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
        toast.error('Erro ao carregar opções');
      }
    };

    fetchOptions();
  }, []);

  // Carregar dados do produto
  useEffect(() => {
    const fetchProductData = async () => {
      if (!open || !product) return;

      setIsLoading(true);
      try {
        const response = await apiClient.get(`/rest/V1/products/${product.sku}`, {
          headers: getAuthHeaders()
        });
        
        const productData = response.data;
        
        setFormData({
          name: productData.name,
          sku: productData.sku,
          price: productData.price.toLocaleString('es-CO', { minimumFractionDigits: 2 }),
          color: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'color')?.value || "",
          material: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'material')?.value || "",
          marca: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'marca')?.value || "",
          estilo: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'estilo')?.value || "",
        });
      } catch (error) {
        console.error('Erro ao carregar dados do produto:', error);
        toast.error('Erro ao carregar dados do produto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      setLoading(true);

      // Remover formatação do preço antes de enviar
      const priceWithoutFormat = formData.price.replace(/[^\d,-]/g, '').replace(',', '.');

      const productData = {
        product: {
          sku: product.sku,
          name: formData.name,
          price: parseFloat(priceWithoutFormat),
          type_id: "simple",
          attribute_set_id: 4, // ID do conjunto de atributos padrão
          status: 1,
          visibility: 4,
          custom_attributes: [
            {
              attribute_code: 'color',
              value: formData.color
            },
            {
              attribute_code: 'material',
              value: formData.material
            },
            {
              attribute_code: 'marca',
              value: formData.marca
            },
            {
              attribute_code: 'estilo',
              value: formData.estilo
            }
          ]
        }
      };

      await apiClient.put(`/rest/V1/products/${product.sku}`, productData, {
        headers: getAuthHeaders()
      });

      toast.success('Produto atualizado com sucesso');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    if (value === '') {
      setFormData({ ...formData, price: '' });
      return;
    }
    const number = parseInt(value);
    const formattedPrice = number.toLocaleString('es-CO', { minimumFractionDigits: 2 });
    setFormData({ ...formData, price: formattedPrice });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Edite as informações do produto abaixo.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="text"
                    value={formData.price}
                    onChange={handlePriceChange}
                    className="pl-7"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">COP</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value || "0"}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Material</Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => setFormData({ ...formData, material: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value || "0"}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select
                  value={formData.marca}
                  onValueChange={(value) => setFormData({ ...formData, marca: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value || "0"}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estilo</Label>
                <Select
                  value={formData.estilo}
                  onValueChange={(value) => setFormData({ ...formData, estilo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {estiloOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value || "0"}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 