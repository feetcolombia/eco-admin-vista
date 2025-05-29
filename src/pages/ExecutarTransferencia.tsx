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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { transferenciaApi } from '@/services/api/transferencia';
import { Trash2, Loader2, X } from 'lucide-react';
import { transferBodegasApi, Source } from '@/api/transferBodegasApi';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
interface TransferenciaDetalle {
  transferencia_bodega_id: string;
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

const ExecutarTransferencia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transferencia, setTransferencia] = useState<any>(null);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [selectedBodega, setSelectedBodega] = useState<string>("");
  const [sonido, setSonido] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [date, setDate] = useState<Date | null>(null);

  // New state for main transfer section fields: Posición Origen y Destino
  const [posicionOrigenMain, setPosicionOrigenMain] = useState<string>('');
  const [posicionDestinoMain, setPosicionDestinoMain] = useState<string>('');
  
  // New state for additional transfer sections
  const [transferSections, setTransferSections] = useState<
    Array<{
      barcode: string;
      error: string;
      produtos: any[];
      soundEnabled: boolean;
      totalEscaneado: number;
      posicionOrigen: string;
      posicionDestino: string;
    }>
  >([]);
  
  // Dummy variable; replace with proper filtering by source.
  const bodegasForSource = []; // e.g. transferBodegasApi.bodegas.filter(b => b.source_code === transferencia?.soruce)

  useEffect(() => {
    fetchTransferencia();
    fetchSources();
  }, [id]);

  const fetchTransferencia = async () => {
    try {
      const data = await transferBodegasApi.getTransferencia(id!, token);
      if (data && data.length > 0) {
        console.log('data', data);
        setTransferencia(data[1]);
        if (data[1].productos && data[1].productos.length > 0) {
          const produtosExistentes = data[1].productos.map((produto: any) => ({
            id: produto.id_producto,
            sku: produto.sku,
            quantidade: parseInt(produto.cantidad_transferir),
            quantidadeDisponivel: parseInt(produto.cantidad_disponible),
            observacion: produto.observacion || ''
          }));
          setProdutos(produtosExistentes);
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

  const fetchSources = async () => {
    try {
      const items: Source[] = await transferBodegasApi.getOrigens();
      setSources(items);
    } catch (error) {
      console.error('Erro ao buscar fontes:', error);
    }
  };

  const getSourceName = (sourceCode: string) => {
    const source = sources.find(s => s.source_code === sourceCode);
    return source ? source.name : sourceCode;
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const data = await transferBodegasApi.scanBarcode(
          barcode,
          transferencia.id_bodega_origen,
          transferencia.id_bodega_destino,
          transferencia.soruce,
          1
        );
  
      if (Array.isArray(data) && data.length > 0 && data[0].success) {
          const produto = data[0];
          const qtyAvailable = parseInt(produto.cantidad_disponible, 10);
  
          setProdutos(prev => {
            const exists = prev.find(p => p.id === produto.id_producto);
            if (exists) {
              if (exists.quantidade + 1 > qtyAvailable) {
                setError("La cantidad disponible del producto es menor a la cantidad a escanear");
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "La cantidad disponible del producto es menor a la cantidad a escanear",
                });
                return prev;
              }
              return prev.map(p =>
                p.id === produto.id_producto
                  ? { ...p, quantidade: p.quantidade + 1 }
                  : p
              );
            }
            playBeep(true);
            return [
              ...prev,
              {
                id: produto.id_producto,
                sku: produto.product_sku,
                quantidade: 1,
                quantidadeDisponivel: qtyAvailable,
                observacion: ''
              }
            ];
          });
          setError('');
          setBarcode('');
      } else {
          setError('Producto no encontrado');
          playBeep(false);
      }
    } catch (error) {
        playBeep(false);
       console.error('Error al validar producto:', error);
       setError('Error al validar producto');
    }
  };

  const handleSave = async () => {
    if (!transferencia) return;
    setSaving(true);

    try {
      const payload = {
        data: {
          transferencia_id: parseInt(transferencia.transferencia_bodega_id),
          soruce: transferencia.soruce,
          responsable: transferencia.responsable,
          nombre_responsable: transferencia.nombre_responsable,
          id_bodega_origen: parseInt(transferencia.id_bodega_origen),
          id_bodega_destino: parseInt(transferencia.id_bodega_destino),
          descripcion: transferencia.descripcion,
          estado: transferencia.estado,
          productos: produtos.map(produto => ({
            producto: "",
            id_producto: produto.id,
            cantidad_transferir: produto.quantidade,
            cantidad_existente: produto.quantidadeDisponivel,
            observacion: produto.observacion,
            sku: produto.sku
          }))
        }
      };

      const [success, updatedId] = await transferBodegasApi.updateTransferenciaPut(payload);
      if (!success) throw new Error('Error al guardar la transferencia');
      toast({
        title: "Éxito",
        description: `Transferencia actualizada correctamente con ID: ${updatedId}`,
      });
      /*navigate('/dashboard/transferencia-mercancia');*/
    } catch (error) {
      console.error('Error al guardar transferencia:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la transferencia",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompletar = () => {
    if (transferencia) {
      navigate(`/dashboard/transferencia-mercancia/${transferencia.transferencia_bodega_id}/confirmar`);
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

  const handleObservacionChange = (id: string, observacion: string) => {
    setProdutos(prev =>
      prev.map(p =>
        p.id === id ? { ...p, observacion } : p
      )
    );
  };

  const playBeep = (success: boolean) => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = success ? 'sine' : 'square';
      oscillator.frequency.setValueAtTime(success ? 800 : 400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Erro ao reproduzir som:', error);
    }
  };
  
  // Functions to handle additional transfer sections
  const addTransferSection = () => {
    setTransferSections(prev => [
      ...prev,
      {
        barcode: '',
        error: '',
        produtos: [],
        soundEnabled: true,
        totalEscaneado: 0,
        posicionOrigen: '',
        posicionDestino: '',
      }
    ]);
  };

  const updateSection = (index: number, updates: Partial<typeof transferSections[0]>) => {
    setTransferSections(prev =>
      prev.map((section, i) => (i === index ? { ...section, ...updates } : section))
    );
  };

  const removeTransferSection = (index: number) => {
    setTransferSections(prev => prev.filter((_, i) => i !== index));
  };

  // Handler for barcode submit in additional sections
  const handleBarcodeSubmitAdd = async (e: React.FormEvent, index: number) => {
    e.preventDefault();
    const section = transferSections[index];
    if (!section.barcode.trim()) return;
    try {
      const data = await transferBodegasApi.scanBarcode(
        section.barcode,
        transferencia.id_bodega_origen,
        transferencia.id_bodega_destino,
        transferencia.soruce,
        1
      );
      if (Array.isArray(data) && data.length > 0 && data[0].success) {
        const produto = data[0];
        const qtyAvailable = parseInt(produto.cantidad_disponible, 10);
        updateSection(index, {
          produtos: (prev => {
            const exists = section.produtos.find((p: any) => p.id === produto.id_producto);
            if (exists) {
              if (exists.quantidade + 1 > qtyAvailable) {
                updateSection(index, { error: "La cantidad disponible del producto es menor a la cantidad a escanear" });
                return section.produtos;
              }
              return section.produtos.map((p: any) =>
                p.id === produto.id_producto ? { ...p, quantidade: p.quantidade + 1 } : p
              );
            }
            return [
              ...section.produtos,
              {
                id: produto.id_producto,
                sku: produto.product_sku,
                quantidade: 1,
                quantidadeDisponivel: qtyAvailable,
                observacion: ''
              }
            ];
          })(section.produtos),
          error: '',
          barcode: '',
          totalEscaneado: section.totalEscaneado + 1
        });
        playBeep(true);
      } else {
        updateSection(index, { error: 'Producto no encontrado' });
        playBeep(false);
      }
    } catch (error) {
      playBeep(false);
      updateSection(index, { error: 'Error al validar producto' });
    }
  };

  if (loading || !transferencia) {
    return <div>Carregando...</div>;
  }

  const totalEscaneado = produtos.reduce((sum, p) => sum + p.quantidade, 0);

  return (
    <div className="mx-auto py-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ejecutar Transferencia</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/transferencia-mercancia')}
          >
            Regresar
          </Button>
          {transferencia.estado !== 'f' && (
            <>
              {transferencia.es_masiva !== "s" && (
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
                  ) : 'Guardar'}
                </Button>
              )}
              <Button        
                className="bg-ecommerce-500 hover:bg-ecommerce-600"
                onClick={handleCompletar}
                disabled={produtos.length === 0}
              >
                Completar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Origen</Label>
              <div className="font-medium">{getSourceName(transferencia.soruce)}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Usuario Responsable</Label>
              <div className="font-medium">{transferencia.nombre_responsable}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Descripción</Label>
              <div className="font-medium">{transferencia.descripcion}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Bodega Origen</Label>
              <div className="font-medium">{transferencia.es_masiva === "s" || transferencia.trasferencia_total == '1' ? "-" : transferencia.nombre_bodega_origen}</div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Consecutivo</Label>
              <div className="font-medium">{transferencia.codigo}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Fecha</Label>
              <div className="font-medium">{transferencia.fecha ? transferencia.fecha.split(" ")[0] : 'N/A'}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Estado</Label>
              <div className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  transferencia.estado === 'n' 
                    ? 'bg-blue-100 text-blue-800'
                    : transferencia.estado === 'p'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {transferencia.estado === 'n' 
                    ? 'Nuevo' 
                    : transferencia.estado === 'p'
                    ? 'En Proceso'
                    : 'Finalizado'}
                </span>
              </div>
            </div>           
            <div>
              <Label className="text-sm text-gray-500">Bodega Destino</Label>
              <div className="font-medium">{transferencia.es_masiva === "s"  || transferencia.trasferencia_total == '1' ? "-" : transferencia.nombre_bodega_destino}</div>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Es masiva</Label>
            <div className="font-medium">{transferencia.es_masiva === 's' ? 'Si' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Main section: Sonido, Total Escaneado y nuevos campos de Posición */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="sound"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'}
          />
          <Label htmlFor="sonido">Sonido</Label>
        </div>
        <div className="text-sm text-gray-500">
          Total Escaneado: <span className="font-bold">{totalEscaneado}</span>
        </div>
      </div>

      {/* New selects for Posición Origen y Posición Destino in main section */}
     {transferencia.trasferencia_total === "1" && (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-sm text-gray-500">Posición Origen</Label>
          <Select value={posicionOrigenMain} onValueChange={setPosicionOrigenMain}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar posición origen" />
            </SelectTrigger>
            <SelectContent>
              {bodegasForSource.map(bodega => (
                <SelectItem key={bodega.bodega_id} value={String(bodega.bodega_id)}>
                  {bodega.bodega_nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Posición Destino</Label>
          <Select value={posicionDestinoMain} onValueChange={setPosicionDestinoMain}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar posición destino" />
            </SelectTrigger>
            <SelectContent>
              {bodegasForSource.map(bodega => (
                <SelectItem key={bodega.bodega_id} value={String(bodega.bodega_id)}>
                  {bodega.bodega_nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Transferencia de productos</h2>
        <form onSubmit={handleBarcodeSubmit} className="mb-6">
          <div className="flex gap-4 items-center max-w-xl">
            <Input
              type="text"
              placeholder="Escanear o ingresar código de barras o Sku del producto"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="flex-1"
              autoFocus
              disabled={transferencia.estado === 'f' || transferencia.es_masiva === "s"}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={transferencia.estado === 'f' || transferencia.es_masiva === "s"}
            >
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
                      disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'}
                    >-</Button>
                    <span>{produto.quantidade}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => incrementarQuantidade(produto.id)}
                      disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'}
                    >+</Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    placeholder="Agregar observación"
                    value={produto.observacion}
                    onChange={(e) => handleObservacionChange(produto.id, e.target.value)}
                    className="max-w-[200px]"
                    disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removerProduto(produto.id)}
                    disabled={transferencia.estado === 'f' || transferencia.es_masiva === "s"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {transferencia.trasferencia_total === "1" && (
        <div className="mt-8">
          <Button onClick={addTransferSection} variant="outline">
            Agregar sección de transferencia adicional
          </Button>

          {transferSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 mb-6 mt-4 relative">
              {/* Close button for additional section */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTransferSection(index)}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold mb-4">
                Transferencia de productos - Sección Adicional {index + 1}
              </h2>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`sound-add-${index}`}
                    checked={section.soundEnabled}
                    onCheckedChange={(checked) =>
                      updateSection(index, { soundEnabled: checked })
                    }
                  />
                  <Label htmlFor={`sound-add-${index}`}>Sonido</Label>
                </div>
                <div className="text-sm text-gray-500">
                  Total Escaneado: <span className="font-bold">{section.totalEscaneado}</span>
                </div>
              </div>
              
              {/* New selects for Posición Origen y Posición Destino in additional section */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-gray-500">Posición Origen</Label>
                  <Select
                    value={section.posicionOrigen}
                    onValueChange={(value) => updateSection(index, { posicionOrigen: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar posición origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodegasForSource.map((bodega) => (
                        <SelectItem key={bodega.bodega_id} value={String(bodega.bodega_id)}>
                          {bodega.bodega_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Posición Destino</Label>
                  <Select
                    value={section.posicionDestino}
                    onValueChange={(value) => updateSection(index, { posicionDestino: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar posición destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodegasForSource.map((bodega) => (
                        <SelectItem key={bodega.bodega_id} value={String(bodega.bodega_id)}>
                          {bodega.bodega_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <form onSubmit={(e) => handleBarcodeSubmitAdd(e, index)} className="mb-6">
                <div className="flex gap-4 items-center max-w-xl">
                  <Input
                    type="text"
                    placeholder="Escanear o ingresar código de barras"
                    value={section.barcode}
                    onChange={(e) => updateSection(index, { barcode: e.target.value })}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" variant="secondary">
                    Adicionar
                  </Button>
                </div>
              </form>

              {section.error && (
                <div className="text-red-500 mb-4">{section.error}</div>
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
                  {section.produtos.map((produto: any) => (
                    <TableRow key={produto.id}>
                      <TableCell>{produto.id}</TableCell>
                      <TableCell>{produto.sku}</TableCell>
                      <TableCell>{produto.quantidadeDisponivel}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateSection(index, {
                              produtos: section.produtos.map((p: any) =>
                                p.id === produto.id && p.quantidade < p.quantidadeDisponivel
                                  ? { ...p, quantidade: p.quantidade - 1 }
                                  : p
                              )
                            })}
                            disabled={transferencia.estado === 'f'}
                          >-</Button>
                          <span>{produto.quantidade}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateSection(index, {
                              produtos: section.produtos.map((p: any) =>
                                p.id === produto.id && p.quantidade < p.quantidadeDisponivel
                                  ? { ...p, quantidade: p.quantidade + 1 }
                                  : p
                              )
                            })}
                            disabled={transferencia.estado === 'f'}
                          >+</Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Agregar observación"
                          value={produto.observacion}
                          onChange={(e) =>
                            updateSection(index, {
                              produtos: section.produtos.map((p: any) =>
                                p.id === produto.id ? { ...p, observacion: e.target.value } : p
                              )
                            })
                          }
                          className="max-w-[200px]"
                          disabled={transferencia.estado === 'f'}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() =>
                            updateSection(index, {
                              produtos: section.produtos.filter((p: any) => p.id !== produto.id)
                            })
                          }
                          disabled={transferencia.estado === 'f'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ExecutarTransferencia;