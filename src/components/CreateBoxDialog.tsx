
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

interface CreateBoxDialogProps {
  open: boolean;
  onClose: () => void;
  parentProduct: Product;
}

export function CreateBoxDialog({ open, onClose, parentProduct }: CreateBoxDialogProps) {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedTalla, setSelectedTalla] = useState('');
  const [tallaOptions, setTallaOptions] = useState<TallaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [childProducts, setChildProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

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
        setChildProducts(childrenResponse.filter(product => !product.is_closedbox));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
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

  const handleSave = async () => {
    try {
      setLoading(true);

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
              value: selectedTalla
            },
            {
              attribute_code: 'is_closedbox',
              value: true
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
      console.error('Erro ao salvar caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Criar Caixa para Produto {parentProduct.sku}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label>SKU da Caixa</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Digite o SKU da caixa"
              />
            </div>
            <div className="space-y-2">
              <label>Código de Barras</label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Digite o código de barras"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label>Tipo de Caixa</label>
            <Select value={selectedTalla} onValueChange={setSelectedTalla}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de caixa" />
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
            <label>Conteúdo da Caixa</label>
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childProducts.map((child) => {
                    const talla = child.custom_attributes.find(attr => attr.attribute_code === 'talla')?.value;
                    return (
                      <TableRow key={child.id}>
                        <TableCell>{child.sku}</TableCell>
                        <TableCell>{child.name}</TableCell>
                        <TableCell>{talla}</TableCell>
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
            {loading ? 'Salvando...' : 'Guardar Caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
