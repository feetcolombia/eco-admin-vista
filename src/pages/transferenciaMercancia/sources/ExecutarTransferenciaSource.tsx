import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { transferSourcesApi } from '@/api/transferSourcesApi';
import { Trash2, Loader2 } from 'lucide-react';
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";

interface TransferenciaDetalle {
  transferencia_source_id: string;
  soruce: string;
  id_bodega_origen: string;
  id_bodega_destino: string;
  cantidad: string;
  descripcion: string;
  responsable: string;
  estado: string;
  codigo: string;
  created_at: string | null;
  updated_at: string | null;
  nombre_bodega_origen: string;
  nombre_bodega_destino: string;
  nombre_responsable: string;
  trasferencia_total: string;
  historico: string | null;
  es_masiva: string;
  productos: any[];
}

interface Bodega {
    bodega_id: number;
    bodega_source: string;
    bodega_nombre: string;
    bodega_altura: number;
    bodega_largo: number;
    bodega_profundidad: number;
    bodega_limite: number;
  }

const ExecutarTransferenciaSource = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transferencia, setTransferencia] = useState<any>(null);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [sonido, setSonido] = useState(false);
  const [totalEscaneado, setTotalEscaneado] = useState(0);
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);

   const { getBodegas} = useIngresoMercanciaApi();

  useEffect(() => {
    fetchTransferencia();
  }, [id]);


    useEffect(() => {
      if (transferencia?.source_origen) {
        fetchBodegas();
      }
    }, [transferencia?.source_origen]);

  const fetchTransferencia = async () => {
    try {
        const data = await transferSourcesApi.getTransferencia(id!);
        if (data) {
          setTransferencia(data);
          if (data.productos_ingreso?.length) {
           const produtosExistentes = data.productos_ingreso.map((raw: string) => {
             const p = JSON.parse(raw);
             return {
               id: p.producto,
               sku: p.sku,
               quantidade: parseInt(p.cantidad, 10),
               quantidadeDisponivel: parseInt(p.cantidad),
               observacion: p.descripcion || ''
             };
           });
            setProdutos(produtosExistentes);
           // si quieres total de unidades escaneadas:
           setTotalEscaneado(produtosExistentes.reduce((sum, x) => sum + x.quantidade, 0));
          }
        }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da transferência.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBodegas = async () => {
    if (transferencia?.source_origen) {
      const data = await getBodegas(transferencia.source_origen);
      setBodegas(data);
      if (data.length > 0) {
        setSelectedBodega(data[0].bodega_nombre);
      }
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim()) return;
    
        try {
          // obtener id de bodega seleccionado
          const bodegaId = bodegas.find(b => b.bodega_nombre === selectedBodega)?.bodega_id;
          if (!bodegaId) {
            setError('Selecciona una bodega');
            playBeep(false);
            return;
          }
    
          const items = await transferSourcesApi.lookupBarcode(
            barcode,
            transferencia.source_origen,
            bodegaId
          );
    
          if (items.length === 0 || (items[0].errors?.length ?? 0) > 0) {
            playBeep(false);
            setError('Producto no encontrado o con errores');
          } else {
            const item = items[0];
            const qtyAvailable = parseInt(item.cantidad, 10);
    
            setProdutos(prev => {
              const exists = prev.find(p => p.id === item.product_id);
              if (exists) {
                return prev.map(p =>
                  p.id === item.product_id
                    ? { 
                        ...p, 
                        quantidade: Math.min(p.quantidade + 1, qtyAvailable),
                        quantidadeDisponivel: qtyAvailable 
                      }
                    : p
                );
              } else {
                console.log('Nuevo producto agregado:', item);
                return [
                  ...prev,
                  {
                    id: item.product_id,
                    sku: item.product_sku,
                    quantidade: 1,
                    quantidadeDisponivel: qtyAvailable,
                    observacion: ''
                  }
                ];
              }
            });
            playBeep(true);
            setError('');
            setBarcode('');
            setTotalEscaneado(prev => prev + 1);
          }
        } catch (err) {
          console.error('Error lookupBarcode:', err);
          setError('Error al validar producto');
          playBeep(false);
        }
  };

  const handleSave = async () => {
    if (!transferencia) return;
    setSaving(true);

    try {

        const selBodega = bodegas.find(b => b.bodega_nombre === selectedBodega);
        if (!selBodega) {
          throw new Error('Selecciona una bodega válida');
        }
        const bodegaId = selBodega.bodega_id;

        const payload = {
           data: {
             estado: 'c',
             tipo: 'ic',
             ingreso_source_productos: produtos.map(p => ({
               transferencia_source_id: Number(transferencia.transferencia_source_id),
               sku: p.sku,
               cantidad: p.quantidade,
               bodega_nombre: selectedBodega,
               bodega_id: bodegaId,
               descripcion: p.observacion || ''
             }))
           }
         };
         // Consumir el endpoint ingreso-products
         const success = await transferSourcesApi.ingresoProductos(payload);
         if (!success) throw new Error('Error al ingresar productos');
         toast({
           title: "Éxito",
           description: "Productos ingresados en transferencia correctamente"
         });
        //navigate('/dashboard/transferencia-mercancia');
        } catch (error) {
            console.error('Error al guardar transferencia:', error);
            toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo ingresar productos"
            });
        } finally {
            setSaving(false);
        }
    };

const handleCompletar = async () => {
     if (!transferencia) return;
     if (!window.confirm("¿Está seguro de completar el proceso de salida del source?")) return;
     setSaving(true);
     try {

      const selBodega = bodegas.find(b => b.bodega_nombre === selectedBodega);
      if (!selBodega) {
        throw new Error('Selecciona una bodega válida');
      }
      const bodegaId = selBodega.bodega_id;

       const payload = {
        data: {
            estado: 'f',
            tipo: 'if',
           ingreso_source_productos: produtos.map(p => ({
             transferencia_source_id: Number(transferencia.transferencia_source_id),
             sku: p.sku,
             cantidad: p.quantidade,
             bodega_nombre: selectedBodega,
             bodega_id: bodegaId,
             descripcion: p.observacion || ''
           }))
         }
       };
       const success = await transferSourcesApi.ingresoProductos(payload);
       if (!success) throw new Error('Error al completar transferencia');
       toast({
         title: "Completado",
         description: "Salida de productos completada exitosamente"
       });
       navigate('/transferenciaMercancia/sources/execute-transferencia-source-ingreso/' + transferencia.transferencia_source_id);
     } catch (error) {
       console.error('Error al completar transferencia:', error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "No se pudo completar la transferencia"
       });
     } finally {
       setSaving(false);
     }
   };

  const incrementarQuantidade = (id: string) => {
    setProdutos(prev => prev.map(produto => {
      if (produto.id === id && produto.quantidade < produto.quantidadeDisponivel) {
        return { ...produto, quantidade: produto.quantidade + 1 };
      }
      return produto;
    }));
  };

  const decrementarQuantidade = (id: string) => {
    setProdutos(prev => prev.map(produto => {
      if (produto.id === id && produto.quantidade > 1) {
        return { ...produto, quantidade: produto.quantidade - 1 };
      }
      return produto;
    }));
  };

  const removerProduto = (id: string) => {
    setProdutos(prev => prev.filter(produto => produto.id !== id));
  };

  if (loading || !transferencia) {
    return <div>Carregando...</div>;
  }

  const playBeep = (success: boolean) => {
    if (!soundEnabled) return;
    
    try {
      // Criar um contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configurar o som
      oscillator.type = success ? 'sine' : 'square';
      oscillator.frequency.setValueAtTime(success ? 800 : 400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      
      // Conectar os nós
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Tocar o som
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Erro ao reproduzir som:', error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ejecutar Transferencia</h1>
        <span className="text-sm text-gray-500">(Salida de productos Source):<strong>{transferencia.source_origen}</strong> </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/transferencia-sources')}
          >
            Regresar
          </Button>
          <Button
            onClick={handleSave}
            variant="secondary"
            disabled={saving || !produtos.length}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
          <Button
            
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
            onClick={handleCompletar}
          >
            Completar
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">ID</Label>
              <div className="font-medium">{transferencia.transferencia_source_id}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Source Origen</Label>
              <div className="font-medium">{transferencia.source_origen}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Usuario Responsable</Label>
              <div className="font-medium">{transferencia.nombre_responsable}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Descripción</Label>
              <div className="font-medium">{transferencia.descripcion}</div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Consecutivo</Label>
              <div className="font-medium">{transferencia.consecutivo}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Source Destino</Label>
              <div className="font-medium">{transferencia.source_destino}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Estado</Label>
              <div className="font-medium">
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {transferencia.estado === 'n' ? 'Nuevo' : transferencia.estado === 'c' ? 'Contando' : 'Completado'}
                </span>
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Fecha</Label>
              <div className="font-medium">{transferencia.fecha}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="sound"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
          <Label htmlFor="sonido">Sonido</Label>
        </div>
        <div className="w-48">
                <Select value={selectedBodega} onValueChange={setSelectedBodega}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a posição" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas.map((bodega) => (
                      <SelectItem key={bodega.bodega_id} value={bodega.bodega_nombre}>
                        {bodega.bodega_nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
        <div className="text-sm text-gray-500">
          Total Escaneado: <span className="font-bold">{totalEscaneado}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Transferencia de productos</h2>
        <form onSubmit={handleBarcodeSubmit} className="mb-6">
          <div className="flex gap-4 items-center max-w-xl">
            <Input
              type="text"
              placeholder="Escanear o ingresar código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" variant="secondary" className="hidden"> 
              Adicionar
            </Button>
          </div>
        </form>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Cantidad Disponible</TableHead>
              <TableHead>Cantidad a Transferir</TableHead>
              <TableHead>Observación</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>{produto.id}</TableCell>
                <TableCell>{produto.sku}</TableCell>
                <TableCell>{produto.quantidadeDisponivel}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => decrementarQuantidade(produto.id)}
                    >-</Button>
                    <span>{produto.quantidade}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => incrementarQuantidade(produto.id)}
                    >+</Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    placeholder="Agregar observación"
                    value={produto.observacion}
                    onChange={() => {}}
                    className="max-w-[200px]"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removerProduto(produto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExecutarTransferenciaSource; 