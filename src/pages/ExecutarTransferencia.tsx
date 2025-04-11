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
  const [sonido, setSonido] = useState(false);
  const [totalEscaneado, setTotalEscaneado] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTransferencia();
  }, [id]);

  const fetchTransferencia = async () => {
    try {
      const data = await transferenciaApi.getTransferencia(id!, token);
      if (data) {
        setTransferencia(data);
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

  const handleCodigoBarrasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigoBarras || !transferencia) return;

    try {
      const [success, data] = await transferenciaApi.scanBarcode(codigoBarras, transferencia, token);
      
      if (success && data) {
        const novoProduto = {
          id_producto: data.id_producto,
          sku: data.product_sku,
          cantidad_disponible: data.cantidad_disponible,
          cantidad_transferir: 1,
          observacion: ''
        };

        setTransferencia(prev => ({
          ...prev,
          productos: [...prev.productos, novoProduto]
        }));

        toast({
          title: "Sucesso",
          description: "Produto adicionado com sucesso",
        });
        setTotalEscaneado(prev => prev + 1);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Produto não encontrado ou não disponível",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao processar o código de barras",
      });
    }

    setCodigoBarras('');
  };

  const handleSave = async () => {
    if (!transferencia || !transferencia.productos.length) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não há produtos para salvar",
      });
      return;
    }

    setSaving(true);
    try {
      await transferenciaApi.saveTransferencia(transferencia, token);
      toast({
        title: "Sucesso",
        description: "Transferência salva com sucesso",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar transferência",
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

  if (loading || !transferencia) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ejecutar Proceso de Transferencia</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/transferencia-mercancia')}
          >
            Regresar
          </Button>
          <Button
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button
            variant="secondary"
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
              <div className="font-medium">{transferencia.transferencia_bodega_id}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Origen</Label>
              <div className="font-medium">{transferencia.soruce}</div>
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
              <div className="font-medium">{transferencia.codigo}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Fecha</Label>
              <div className="font-medium">{transferencia.created_at || 'N/A'}</div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Estado</Label>
              <div className="font-medium">
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Nuevo
                </span>
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-sm text-gray-500">Bodega Origen</Label>
              <div className="font-medium">{transferencia.nombre_bodega_origen}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Bodega Destino</Label>
              <div className="font-medium">{transferencia.nombre_bodega_destino}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="sonido"
            checked={sonido}
            onCheckedChange={setSonido}
          />
          <Label htmlFor="sonido">Sonido</Label>
        </div>
        <div className="text-sm text-gray-500">
          Total Escaneado: <span className="font-bold">{totalEscaneado}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Transferencia de productos</h2>
        <form onSubmit={handleCodigoBarrasSubmit} className="mb-6">
          <div className="flex gap-4 items-center max-w-xl">
            <Input
              type="text"
              placeholder="Escanear o ingresar código de barras"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" variant="secondary">
              Adicionar
            </Button>
          </div>
        </form>

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
            {transferencia?.productos.map((produto) => (
              <TableRow key={produto.transferencia_productos_id}>
                <TableCell>{produto.id_producto}</TableCell>
                <TableCell>{produto.sku}</TableCell>
                <TableCell>{produto.cantidad_disponible}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {}}>-</Button>
                    <span>{produto.cantidad_transferir}</span>
                    <Button variant="outline" size="sm" onClick={() => {}}>+</Button>
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
                <TableCell>
                  <Button variant="destructive" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
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

export default ExecutarTransferencia; 