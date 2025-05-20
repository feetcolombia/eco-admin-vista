import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@/api/productApi";
import { apiClient, getAuthHeaders } from "@/api/apiConfig";
import { toast } from "sonner";
import { useAttributeOptions, AttributeOption } from "@/hooks/useAttributeOptions";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Esquema de validação com Zod
const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().min(1, "SKU é obrigatório"),
  price: z.string().refine(value => /^\d{1,3}(\.\d{3})*(,\d{2})?$/.test(value) || /^\d+(,\d{2})?$/.test(value) || /^\d+$/.test(value), {
    message: "Preço deve ser um número válido (ex: 1.234,56 ou 1234.56 ou 1234)"
  }).transform(val => val.replace(/\./g, '').replace(',', '.')), // Normaliza para API: remove pontos e troca vírgula por ponto
  color: z.string().optional(),
  material: z.string().optional(),
  marca: z.string().optional(),
  estilo: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface EditProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export function EditProductDialog({ open, onClose, product, onSuccess }: EditProductDialogProps) {
  const attributeCodes = ['color', 'material', 'marca', 'estilo'];
  const { options: attributeOptions, loading: attributesLoading, error: attributesError } = useAttributeOptions(attributeCodes);

  const [isLoadingProductData, setIsLoadingProductData] = useState(true);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      price: "",
      color: "",
      material: "",
      marca: "",
      estilo: "",
    },
  });

  const { control, handleSubmit, reset, setValue, formState: { isSubmitting } } = form;

  const formatPriceForDisplay = (value: string | number): string => {
    if (typeof value === 'number') {
      value = value.toString();
    }
    if (!value) return "";
    const numberValue = parseFloat(value.replace(/[^\d,.]/g, '').replace('.', '').replace(',', '.'));
    if (isNaN(numberValue)) return "";
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numberValue);
  };
  
  const normalizePriceForForm = (value: string): string => {
    return value.replace(/[^\d]/g, ''); 
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (!open || !product) {
        reset();
        setIsLoadingProductData(false);
        return;
      }

      setIsLoadingProductData(true);
      try {
        const response = await apiClient.get(`/rest/V1/products/${product.sku}`, {
          headers: getAuthHeaders()
        });
        
        const productData = response.data;
        
        reset({
          name: productData.name,
          sku: productData.sku,
          price: formatPriceForDisplay(productData.price),
          color: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'color')?.value || "",
          material: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'material')?.value || "",
          marca: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'marca')?.value || "",
          estilo: productData.custom_attributes.find((attr: any) => attr.attribute_code === 'estilo')?.value || "",
        });
      } catch (error) {
        console.error('Erro ao carregar dados do produto:', error);
        toast.error('Erro ao carregar dados do produto');
        reset();
      } finally {
        setIsLoadingProductData(false);
      }
    };

    fetchProductData();
  }, [open, product, reset]);

  const onSubmitForm = async (data: ProductFormData) => {
    if (!product) return;

    try {
      const priceForApi = parseFloat(data.price);
      if (isNaN(priceForApi)) {
        toast.error("Formato de preço inválido para envio.");
        return;
      }

      const productPayload = {
        product: {
          sku: product.sku,
          name: data.name,
          price: priceForApi,
          type_id: "simple",
          attribute_set_id: 4,
          status: 1,
          visibility: 4,
          custom_attributes: [
            { attribute_code: 'color', value: data.color },
            { attribute_code: 'material', value: data.material },
            { attribute_code: 'marca', value: data.marca },
            { attribute_code: 'estilo', value: data.estilo },
          ].filter(attr => attr.value !== "" && attr.value !== undefined),
        }
      };

      await apiClient.put(`/rest/V1/products/${product.sku}`, productPayload, {
        headers: getAuthHeaders()
      });

      toast.success('Produto atualizado com sucesso');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto. Verifique o console para mais detalhes.');
    }
  };

  if (!open) return null;

  const renderSelectField = (name: keyof ProductFormData, label: string, placeholder: string) => {
    const options = attributeOptions[name as string] || [];
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
              disabled={attributesLoading || isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {attributesLoading && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                {!attributesLoading && options.length === 0 && <SelectItem value="no-options" disabled>Nenhuma opção disponível</SelectItem>}
                {options.map((option: AttributeOption) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Produto {product?.sku}</DialogTitle>
          <DialogDescription>
            Edite as informações do produto abaixo. Nome e SKU não são editáveis.
          </DialogDescription>
        </DialogHeader>

        {isLoadingProductData || attributesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-t-ecommerce-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Carregando dados...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Preço</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="0"
                              className="pl-7 pr-12"
                              onChange={(e) => {
                                const normalized = normalizePriceForForm(e.target.value);
                                const formatted = formatPriceForDisplay(normalized);
                                field.onChange(formatted);
                              }}
                              onBlur={(e) => {
                                const normalized = normalizePriceForForm(e.target.value);
                                const formatted = formatPriceForDisplay(normalized);
                                field.onChange(formatted);
                              }}
                              value={field.value || ""}
                            />
                          </FormControl>
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">COP</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderSelectField("color", "Cor", "Selecione a cor")}
                {renderSelectField("material", "Material", "Selecione o material")}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderSelectField("marca", "Marca", "Selecione a marca")}
                {renderSelectField("estilo", "Estilo", "Selecione o estilo")}
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingProductData || attributesLoading}>
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 