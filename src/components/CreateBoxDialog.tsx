import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import productApi, { Product, TallaOption, ProductDetail } from '@/api/productApi';
import { useToast } from "@/components/ui/use-toast";

interface CreateBoxDialogProps {
  open: boolean;
  onClose: () => void;
  parentProduct: Product;
}

export function CreateBoxDialog({ open, onClose, parentProduct }: CreateBoxDialogProps) {
  const { toast } = useToast();
  const [sku, setSku] = useState(parentProduct.sku);
  const [barcode, setBarcode] = useState('');
  const [selectedTalla, setSelectedTalla] = useState('');
  const [tallaOptions, setTallaOptions] = useState<TallaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [childProducts, setChildProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [autoSelectedMessage, setAutoSelectedMessage] = useState('');
  const [skuError, setSkuError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tallaResponse, childrenResponse] = await Promise.all([
          productApi.getTallaOptions(),
          productApi.getProductChildren(parentProduct.sku)
        ]);
        
        // Filtrar opções vazias e ordenar por label
        const filteredOptions = tallaResponse
          .filter(option => option.value && option.label.trim())
          .sort((a, b) => {
            // Tenta extrair números dos labels para ordenação numérica
            const numA = parseInt(a.label.replace(/[^\d]/g, ''));
            const numB = parseInt(b.label.replace(/[^\d]/g, ''));
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return a.label.localeCompare(b.label);
          });
        
        setTallaOptions(filteredOptions);
        const filteredChildren = childrenResponse.filter(product => !product.is_closedbox);
        setChildProducts(filteredChildren);

        // Encontrar a próxima caixa disponível
        if (filteredChildren.length > 0) {
          const existingBoxes = childrenResponse.filter(product => product.is_closedbox);
          console.log('Caixas existentes:', existingBoxes);
          console.log('Número de caixas existentes:', existingBoxes.length);
          console.log('Opções de caixa disponíveis:', filteredOptions);
          
          const nextBoxNumber = existingBoxes.length + 1;
          console.log('Próximo número de caixa:', nextBoxNumber);
          
          const nextBox = filteredOptions.find(option => option.label === `Caja ${nextBoxNumber}`);
          console.log('Próxima caixa encontrada:', nextBox);
          
          if (nextBox) {
            setSelectedTalla(nextBox.value);
            setAutoSelectedMessage(`Se ha seleccionado automáticamente Caja ${nextBoxNumber} como tipo de caja predeterminado.`);
          } else {
            console.log('Nenhuma caixa encontrada com o número:', nextBoxNumber);
          }
        } else {
          console.log('Não há produtos filhos filtrados');
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, parentProduct.sku]);

  const handleQuantityChange = (sku: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities({ ...quantities, [sku]: quantity });
  };

  const validateSku = async (value: string) => {
    if (!value.trim()) {
      setSkuError('El SKU es obligatorio');
      return false;
    }

    try {
      const existingProduct = await productApi.getProductBySku(value);
      if (existingProduct) {
        setSkuError('Ya existe un producto con este SKU. Por favor, elija otro SKU.');
        return false;
      }
      setSkuError('');
      return true;
    } catch (error) {
      console.error('Error al validar SKU:', error);
      setSkuError('Error al validar el SKU. Por favor, intente nuevamente.');
      return false;
    }
  };

  const handleSkuChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSku(value);
    if (value.trim()) {
      await validateSku(value);
    } else {
      setSkuError('');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validar SKU antes de continuar
      const isSkuValid = await validateSku(sku);
      if (!isSkuValid) {
        return;
      }

      // Encontrar o valor correto do atributo talla para a caixa selecionada
      const selectedTallaOption = tallaOptions.find(option => option.value === selectedTalla);
      if (!selectedTallaOption) {
        throw new Error('No se encontró la opción de talla seleccionada');
      }

      // Criar a caixa
      await productApi.createBox({
        product: {
          sku,
          name: sku,
          price: 0,
          status: 1,
          visibility: 1,
          type_id: 'simple',
          attribute_set_id: 4,
          weight: 1,
          custom_attributes: [
            {
              attribute_code: 'talla',
              value: selectedTallaOption.value
            }
          ]
        }
      });

      // Definir como filho do produto pai
      await productApi.setAsChild(parentProduct.sku, sku);

      // Salvar detalhes da caixa
      const details: ProductDetail[] = Object.entries(quantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([childSku, quantity]) => ({
          sku: childSku,
          size: childSku.split('-').slice(-1)[0],
          quantity
        }));

      await productApi.saveBoxDetails(sku, details);

      onClose();
    } catch (error) {
      console.error('Error al guardar la caja:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear Caja para Producto {parentProduct.sku}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {autoSelectedMessage && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
              {autoSelectedMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label>SKU de la Caja</label>
              <Input
                value={sku}
                onChange={handleSkuChange}
                placeholder="Ingrese el SKU de la caja"
                className={skuError ? "border-red-500" : ""}
              />
              {skuError && (
                <p className="text-sm text-red-500 mt-1">{skuError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label>Código de Barras</label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ingrese el código de barras"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label>Tipo de Caja</label>
            <Select value={selectedTalla} onValueChange={setSelectedTalla}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el tipo de caja" />
              </SelectTrigger>
              <SelectContent>
                {tallaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label>Contenido de la Caja</label>
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden">SKU</TableHead>
                    <TableHead>Talla</TableHead>
                    <TableHead>Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childProducts.map((child) => {
                    const tallaValue = child.custom_attributes.find(attr => attr.attribute_code === 'talla')?.value;
                    const tallaLabel = tallaOptions.find(option => option.value === tallaValue)?.label || tallaValue;
                    return (
                      <TableRow key={child.id}>
                        <TableCell className="hidden">{child.sku}</TableCell>
                        <TableCell>{tallaLabel}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={quantities[child.sku] || ''}
                            onChange={(e) => handleQuantityChange(child.sku, e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Caja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
