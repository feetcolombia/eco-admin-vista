import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TransferenciaDetalhes {
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
  productos: Array<{
    transferencia_productos_id: string;
    cantidad_transferir: string;
    cantidad_disponible: string;
    observacion: string;
    created_at: string;
    transferencia_bodega_id: string;
    id_producto: string;
    sku: string;
  }>;
}

const TransferenciaBodegaDetalhes = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [transferencia, setTransferencia] = useState<TransferenciaDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransferenciaDetalhes = async () => {
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
        console.error('Erro ao buscar detalhes da transferência:', error);
      } finally {
        setLoading(false);
      }
    };

    if (location.state?.transferencia) {
      setTransferencia(location.state.transferencia);
      setLoading(false);
    } else {
      fetchTransferenciaDetalhes();
    }
  }, [id, token, location.state]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!transferencia) {
    return <div>Transferência não encontrada</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/transferencia-mercancia')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Detalhes da Transferência {transferencia.codigo}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Informações da Transferência</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Origem:</span> {transferencia.nombre_bodega_origen}</p>
            <p><span className="font-medium">Destino:</span> {transferencia.nombre_bodega_destino}</p>
            <p><span className="font-medium">Responsável:</span> {transferencia.nombre_responsable}</p>
            <p><span className="font-medium">Estado:</span> {transferencia.estado}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold p-4">Produtos Escaneados</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Quantidade a Transferir</TableHead>
              <TableHead>Quantidade Disponível</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead>Data de Criação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transferencia.productos.map((produto) => (
              <TableRow key={produto.transferencia_productos_id}>
                <TableCell>{produto.sku}</TableCell>
                <TableCell>{produto.cantidad_transferir}</TableCell>
                <TableCell>{produto.cantidad_disponible}</TableCell>
                <TableCell>{produto.observacion || '-'}</TableCell>
                <TableCell>{new Date(produto.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TransferenciaBodegaDetalhes; 