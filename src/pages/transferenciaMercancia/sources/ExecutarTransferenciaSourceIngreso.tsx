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

interface Produto {
  id: string;
  sku: string;
  quantidade: number;
  quantidadeDisponivel: number;
  observacion: string;
  posicion: number;
  bodega_id: number;
}

const ExecutarTransferenciaSourceIngreso = () => {
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
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [posiciones, setPosiciones] = useState<{ id: number; name: string }[]>([]);

   const { getBodegas} = useIngresoMercanciaApi();

  useEffect(() => {
    fetchTransferencia();
  }, [id]);


    useEffect(() => {
      if (transferencia?.source_origen) {
        fetchBodegas();
      }

     if (transferencia?.source_destino) {
        (async () => {
          const list = await getBodegas(transferencia.source_destino);
          setPosiciones([{ id: 0, name: "Ninguna" }, ...list.map(bodega => ({ id: bodega.bodega_id, name: bodega.bodega_nombre }))]);
        })();
      }
    }, [transferencia?.source_origen, transferencia?.source_destino]);

    useEffect(() => {
      if (bodegas.length && produtos.length) {
        setProdutos(ps =>
          ps.map(p => ({ ...p, bodega_id: p.bodega_id || bodegas[0].bodega_id }))
        );
      }
    }, [bodegas]);

    const handleBodegaChange = (idx: number, bodegaId: number) => {
      setProdutos(prev => {
        const arr = [...prev];
        arr[idx].bodega_id = bodegaId;
        return arr;
      });
    };

  const fetchTransferencia = async () => {
    try {
        const data = await transferSourcesApi.getTransferencia(id!);
        let productosMostrar: string[] = []; 
        if (data) {
          setTransferencia(data);
          //valida si data.tipo = 'if' o 'cs'
          if (data.tipo === 'if') {
            productosMostrar = data.productos_ingreso;
          } else if (data.tipo === 'sc' || data.tipo === 'sf') {
            productosMostrar = data.productos_salida;
          }
          if (productosMostrar?.length) {
                    const produtosExistentes = productosMostrar.flatMap((raw: string) => {
                        const p = JSON.parse(raw);
                        const available = parseInt(p.cantidad, 10);
                        return Array.from({ length: available }, () => ({
                          id: p.producto,
                          sku: p.sku,
                          quantidade: 1,
                          quantidadeDisponivel: parseInt(p.cantidad, 10),
                          observacion: p.observacion || '',
                          posicion: p.bodega_id || 0,
                          bodega_id: p.bodega_id || 0
                        }));
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

   const handlePosicionChange = (idx: number, posId: number) => {
       setProdutos(prev => {
         const copy = [...prev];
         copy[idx] = { ...copy[idx], posicion: posId };
         return copy;
       });
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

  const handleObservacionChange = (idx: number, observacion: string) => {
    setProdutos(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], observacion };
      return copy;
    });
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim()) return;
    
        try {
          // obtener id de bodega seleccionado
          const bodegaId = bodegas.find(b => b.bodega_nombre === selectedBodega)?.bodega_id;
          if (!bodegaId) {
            setError('Selecciona una bodega');
            return;
          }
    
          const items = await transferSourcesApi.lookupBarcode(
            barcode,
            transferencia.source_origen,
            bodegaId,
            false
          );
    
          if (items.length === 0 || (items[0].errors?.length ?? 0) > 0) {
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
                return [
                  ...prev,
                  {
                    id: item.product_id,
                    sku: item.product_sku,
                    quantidade: 1,
                    quantidadeDisponivel: qtyAvailable,
                    observacion: '',
                    posicion: bodegaId,
                    bodega_id: bodegaId
                  }
                ];
              }
            });
    
            setError('');
            setBarcode('');
            setTotalEscaneado(prev => prev + 1);
          }
        } catch (err) {
          console.error('Error lookupBarcode:', err);
          setError('Error al validar producto');
        }
  };

  const handleSave = async () => {
    if (!transferencia) return;
    // Validar que ningún campo editable de la tabla esté vacío
    const invalid = produtos.some(p =>
      p.posicion === 0 || p.quantidade < 1
    );
    if (invalid) {
      alert('Completa todos los campos de cada fila antes de guardar.');
      return;
    }

    setSaving(true);
  
    try {      
      // construir payload para salida-products
      const payload = {
          data: {
            estado: 'c',
            tipo: 'cs',
            salida_source_productos: produtos.map(p => ({
              transferencia_source_id: transferencia.transferencia_source_id,
              sku: p.sku,
              cantidad: p.quantidade,
              bodega_id: p.posicion,
              observacion: p.observacion
            }))
          }
        };
  
      // llamar al endpoint salida-products
      const success = await transferSourcesApi.salidaProductos(payload);
      if (!success) throw new Error('Error al registrar salida de productos');
  
      toast({
        title: "Éxito",
        description: "Salida de productos registrada correctamente"
      });
      //navigate('/dashboard/transferencia-mercancia');
    } catch (error) {
      console.error('Error al guardar salida:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar la salida de productos"
      });
    } finally {
      setSaving(false);
    }
  };

 const handleCompletar = async () => {
       if (!transferencia) return;
       if (!window.confirm("¿Está seguro de completar el proceso de ingreso al source?")) return;
       setSaving(true);
       try {
          const payload = {
            data: {
              estado: 'f',
              tipo: 'cs',
              salida_source_productos: produtos.map(p => ({
                transferencia_source_id: transferencia.transferencia_source_id,
                sku: p.sku,
                cantidad: p.quantidade,
                bodega_id: p.posicion,
                observacion: p.observacion
              }))
            }
          };
         const success = await transferSourcesApi.salidaProductos(payload);
         if (!success) throw new Error('Error al completar transferencia');
         toast({
           title: "Completado",
           description: "Salida de productos completada exitosamente"
         });
         navigate('/transferenciaMercancia/sources/confirm-transferencia-source/'+ transferencia.transferencia_source_id);
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ejecutar Transferencia</h1>
        <span className="text-sm text-gray-500">(Ingreso de productos Source):<strong>{transferencia.source_destino_name}</strong> </span>
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
              <Label className="text-sm text-gray-500">Source Origen</Label>
              <div className="font-medium">{transferencia.source_origen_name}</div>
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
              <div className="font-medium">{transferencia.source_destino_name}</div>
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
        <div className="flex items-center space-x-2 disabled">
          <Switch
            id="sonido"
            checked={sonido}
            disabled
            onCheckedChange={setSonido}
          />
          <Label htmlFor="sonido">Sonido</Label>
        </div>
        {/* <div className="w-48">
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
              </div> */}
        <div className="text-sm text-gray-500">
          Total Escaneado: <span className="font-bold">{totalEscaneado}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Transferencia de productos</h2>
        <form onSubmit={handleBarcodeSubmit} className="mb-6 hidden">
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
              <TableHead>Posición</TableHead>
              <TableHead>Cantidad Disponible</TableHead>
              <TableHead>Cantidad a Transferir</TableHead>
              <TableHead>Observación</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {produtos.map((produto, idx) => (
                 <TableRow key={idx}>
                <TableCell>{produto.id}</TableCell>
                <TableCell>{produto.sku}</TableCell>
                <TableCell>
                <Select
                 value={produto.posicion.toString()}
                 onValueChange={(v) => handlePosicionChange(idx, Number(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {posiciones.map(pos => (
                     <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </TableCell>
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
                    onChange={(e) => handleObservacionChange(idx, e.target.value)}
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

export default ExecutarTransferenciaSourceIngreso; 