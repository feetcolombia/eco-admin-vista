import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { transferBodegasApi, Source } from '@/api/transferBodegasApi';

interface Produto {
  transferencia_productos_id: string;
  cantidad_transferir: string;
  cantidad_disponible: string;
  observacion: string;
  created_at: string;
  transferencia_bodega_id: string;
  id_producto: string;
  sku: string;
}
const ConfirmarTransferencia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transferencia, setTransferencia] = useState<any>(null);

  useEffect(() => {
    fetchTransferencia();
  }, [id]);

  const fetchTransferencia = async () => {
    try {
      const data = await transferBodegasApi.getTransferencia(id!, token);
      if (data) {
        setTransferencia(data[1]);
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

  const handleConfirmar = async () => {
    try {
      await transferBodegasApi.updateTransferenciaPut({
          data: {
            ...transferencia,
            estado: 'f',
            transferencia_id: transferencia.transferencia_bodega_id,
          }
        });
      toast({
        title: "Datos guardados",
        description: "Transferencia finalizad correctamente.",
      });
      navigate('/dashboard/transferencia-mercancia');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Error al finalizar la transferencia.",
      });
    }
  };

  const handleExportarExcel = () => {
    // Implementar exportação para Excel
  };

  if (loading || !transferencia) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verificación - Confirmar Proceso de Transferencia</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Regresar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportarExcel}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar a Excel
          </Button>
          <Button
            onClick={() => {
              const ok = window.confirm(
                'Esta acción finalizará el proceso y no podrá ser revertida.'
              )
              if (!ok) return
              handleConfirmar()
            }}
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
          >
            Confirmar
         </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Total de Elementos Escaneados</h2>
          <p className="text-4xl font-bold">{transferencia.productos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Información de Transferencia</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bodega Origen:</p>
              <p className="font-medium">{transferencia.nombre_bodega_origen}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bodega Destino:</p>
              <p className="font-medium">{transferencia.nombre_bodega_destino}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID Transferencia:</p>
              <p className="font-medium">{transferencia.transferencia_bodega_id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Disponible</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Transferir</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transferencia.productos.map((produto) => (
              <tr key={produto.transferencia_productos_id}>
                <td className="px-6 py-4 whitespace-nowrap">{produto.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap">{produto.cantidad_disponible}</td>
                <td className="px-6 py-4 whitespace-nowrap">{produto.cantidad_transferir}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConfirmarTransferencia; 