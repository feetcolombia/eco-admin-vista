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
  const [transferencia, setTransferencia] = useState<TransferenciaDetalle | null>(null);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [sonido, setSonido] = useState(false);
  const [totalEscaneado, setTotalEscaneado] = useState(0);

  useEffect(() => {
    fetchTransferencia();
  }, [id]);

  const fetchTransferencia = async () => {
    try {
      const response = await fetch(
        `https://stg.feetcolombia.com/rest/V1/transferenciabodegas/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const [success, data] = await response.json();
      if (success) {
        setTransferencia(data);
      }
    } catch (error) {
      console.error('Erro ao buscar transferência:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da transferência.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodigoBarrasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar lógica de escaneamento
    setCodigoBarras('');
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
            onClick={() => {}}
          >
            Guardar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {}}
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
          <Input
            type="text"
            placeholder="Escanear o ingresar código de barras"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            className="max-w-xl"
          />
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
            {transferencia.productos.map((produto, index) => (
              <TableRow key={index}>
                <TableCell>{produto.id}</TableCell>
                <TableCell>{produto.sku}</TableCell>
                <TableCell>{produto.quantidade_disponivel}</TableCell>
                <TableCell>{produto.quantidade_transferir}</TableCell>
                <TableCell>{produto.observacao}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Remover
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