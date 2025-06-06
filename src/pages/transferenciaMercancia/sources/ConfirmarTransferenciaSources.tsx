import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { transferSourcesApi } from '@/api/transferSourcesApi';

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

interface TransferenciaConfirmacao {
  transferencia_bodega_id: string;
  soruce: string;
  id_bodega_origen: string;
  id_bodega_destino: string;
  cantidad: string;
  descripcion: string;
  responsable: string;
  estado: string;
  codigo: string;
  nombre_bodega_origen: string;
  nombre_bodega_destino: string;
  nombre_responsable: string;
  productos: Produto[];
}

const ConfirmarTransferenciaSource = () => {
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
      const data = await transferSourcesApi.getTransferencia(id!);
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

  const handleConfirmar = async () => {
    if (!transferencia) return;
    const ok = window.confirm(
      '¿Desea finalizar el proceso de transferencia de sources?'
    );
    if (!ok) return;

    try {
      setLoading(true);
      const [
        updatedTransfer,
        ingresoResults,
        salidaResults
      ] = await transferSourcesApi.processProducts(
        transferencia.transferencia_source_id
      );

      toast({
        title: 'Proceso completado',
        description: `Transferencia ${updatedTransfer.consecutivo} finalizada.`
      });

      // opcional: mostrar resultados en consola o UI
      console.log('Ingreso updates:', ingresoResults);
      console.log('Salida updates:', salidaResults);

      navigate('/dashboard/transferencia-sources');
    } catch (error) {
      console.error('Error al procesar transferencia:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo finalizar la transferencia.'
      });
    } finally {
      setLoading(false);
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
          {/* <Button
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
          </Button> */}
          {transferencia.estado !== 'f' && (
           <Button
             onClick={handleConfirmar}
             className="bg-ecommerce-500 hover:bg-ecommerce-600"
           >
             Finalizar Proceso
           </Button>
         )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Total de Elementos Escaneados</h2>
          <p className="text-4xl font-bold">{transferencia.productos_salida.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Información de Transferencia</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Source Origen:</p>
              <p className="font-medium">{transferencia.source_origen}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Source Destino:</p>
              <p className="font-medium">{transferencia.source_destino}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID Transferencia:</p>
              <p className="font-medium">{transferencia.transferencia_source_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Consecutivo:</p>
              <p className="font-medium">{transferencia.consecutivo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Descripcion:</p>
              <p className="font-medium">{transferencia.descripcion}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2 px-6">
        <h3 className="text-lg font-semibold">Productos Ingreso : {transferencia.source_origen}</h3>
      </div>
        <div className="bg-white rounded-lg shadow overflow-hidden ingreso_productos mb-6">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Disponible</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                            {transferencia.productos_ingreso.map((raw: string, idx: number) => {
                    const p = JSON.parse(raw) as {
                        salida_source_producto_id: string;
                        sku: string;
                        cantidad: string;
                        bodega_nombre: string;
                    };
                    return (
                        <tr key={p.salida_source_producto_id ?? idx}>
                        <td className="px-6 py-4 whitespace-nowrap">{p.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{p.cantidad}</td>                        
                        <td className="px-6 py-4 whitespace-nowrap"> { !p.bodega_nombre ? 'Ninguna' : p.bodega_nombre }</td>
                        </tr>
                    );
                    })}
                </tbody>
            </table>
        </div>
        <hr className="my-6" />
        <div className="mb-2 px-6">
            <h3 className="text-lg font-semibold">Productos Salida : {transferencia.source_destino}</h3>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden salida_productos">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Disponible</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                    </tr>
                </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                                {transferencia.productos_salida.map((raw: string, idx: number) => {
                        const p = JSON.parse(raw) as {
                            salida_source_producto_id: string;
                            sku: string;
                            cantidad: string;
                            bodega_nombre: string;
                        };
                        return (
                            <tr key={p.salida_source_producto_id ?? idx}>
                            <td className="px-6 py-4 whitespace-nowrap">{p.sku}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{p.cantidad}</td>
                            <td className="px-6 py-4 whitespace-nowrap"> { !p.bodega_nombre ? 'Ninguna' : p.bodega_nombre }</td>
                            </tr>
                        );
                        })}
                    </tbody>
            </table>
        </div>
    </div>
  );
};

export default ConfirmarTransferenciaSource; 