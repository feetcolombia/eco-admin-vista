import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useExportWorksheet } from "@/hooks/useExportWorksheet";
import { toast } from "sonner";
import { transferBodegasApi, Source } from '@/api/transferBodegasApi';

interface Produto {
  transferencia_productos_id?: string;
  cantidad_transferir: string;
  cantidad_disponible: string;
  observacion: string;
  created_at?: string;
  transferencia_bodega_id?: string;
  id_producto?: string;
  sku: string;
  // Campo adicional para secciones
  bodega?: string;
  bodega_destino?: string;
}

const ConfirmarTransferencia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transferencia, setTransferencia] = useState<any>(null);
  const [sections, setSections] = useState<Produto[][]>([]);
  const { exportWorksheet } = useExportWorksheet();
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchTransferencia();
  }, [id]);

  const fetchTransferencia = async () => {
    try {
      const data = await transferBodegasApi.getTransferencia(id!, token);
      if (data) {
        const t = data[1];
        setTransferencia(t);
        
        // Si la transferencia es total, se extraen las secciones de productos
        if (t.trasferencia_total === "1") {
          const _sections: Produto[][] = [];
          // Recorrer cada propiedad del objeto t para identificar secciones
          Object.entries(t).forEach(([key, value]) => {
            if (key.startsWith("productos_seccion_") && value && typeof value === 'object') {
              // En este caso, value es un objeto que contiene claves numéricas para los productos
              const sectionProducts: Produto[] = [];
              Object.entries(value).forEach(([k, v]) => {
                // Si la clave es numérica, se trata de un producto
                if (!isNaN(parseInt(k))) {
                  sectionProducts.push({
                    sku: v.sku,
                    cantidad_transferir: v.cantidad_transferir,
                    cantidad_disponible: v.cantidad_disponible,
                    bodega: value.nombre_bodega_origen || "",
                    bodega_destino: value.nombre_bodega_destino || ""
                  });
                }
              });
              // Sólo agregamos la sección si tiene productos
              if (sectionProducts.length) {
                _sections.push(sectionProducts);
              }
            }
          });
          setSections(_sections);
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

  const handleConfirmar = async () => {
    try {
      // Preparar el payload; si es transferencia total, limpiamos el array de productos
      const payloadData: any = {
        ...transferencia,
        estado: 'f',
        transferencia_id: transferencia.transferencia_bodega_id,
      };
  
      if (transferencia.trasferencia_total === "1") {
        payloadData.productos = [];
      }
  
      await transferBodegasApi.updateTransferenciaPut({
        data: payloadData
      });
  
      toast({
        title: "Datos guardados",
        description: "Transferencia finalizada correctamente.",
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

  const handleExportarExcel = async () => {
    try {
      // Obtenemos el ID de la transferencia desde el estado
      const transferenciaId = transferencia.transferencia_bodega_id;
      const result = await transferBodegasApi.exportTransferenciaExcel(transferenciaId);
      if (result && result.length > 0) {
        const data = result[0];
        const transformedTable = data.table.map((row: any) => {
          const product = catalogProducts.find(
            (p: any) => Number(p.entity_id) === Number(row.id_producto)
          );
          return {
            SKU: row.sku,
            "Cantidad Transferir": row.cantidad_transferir,
            "Cantidad Disponible": row.cantidad_disponible,
            Observación: row.observacion,
            "Bodega Origen": row.bodega_origen_nombre,
            "Bodega Destino": row.bodega_destino_nombre,
          };
        });
  
        const worksheetData = {
          header: {
            "Source": data.header.soruce,
            "Codigo": data.header.codigo,
            "Responsable": data.header.nombre_responsable,
            "Es másiva": data.es_masiva === 's' ? 'Sí' : 'No',
            "Descripción": data.header.descripcion || "",
          },
          table: transformedTable
        };
  
        exportWorksheet(
          worksheetData,
          `TransferenciaBodega_${data.header.codigo}.xlsx`,
          ["SKU", "Cantidad Transferir", "Cantidad Disponible", "Observación", "Bodega Origen", "Bodega Destino"]
        );
        toast({
          title: "Exportación exitosa"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Error al exportar, no se encontraron datos.",
        });
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Error al exportar, no se encontraron datos.",
      });
    }
  };
  
  if (loading || !transferencia) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verificación - Confirmar Proceso de Transferencia</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
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
              const ok = window.confirm('Esta acción finalizará el proceso y no podrá ser revertida.');
              if (!ok) return;
              handleConfirmar();
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
          <p className="text-4xl font-bold">
            {transferencia.trasferencia_total === "1"
              ? sections.reduce((total, sec) => total + sec.length, 0)
              : transferencia.productos.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Información de Transferencia</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bodega Origen:</p>
              <p className="font-medium">{transferencia.es_masiva === "s" || transferencia.trasferencia_total === "1" ? "-" : transferencia.nombre_bodega_origen}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bodega Destino:</p>
              <p className="font-medium">{transferencia.es_masiva === "s" || transferencia.trasferencia_total === "1" ? "-" : transferencia.nombre_bodega_destino}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Consecutivo:</p>
              <p className="font-medium">{transferencia.codigo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Es masiva:</p>
              <p className="font-medium">{transferencia.es_masiva === 's' ? 'Si' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {transferencia.trasferencia_total === "1" ? (
        <>
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <h2 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sección {index}
              </h2>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Disponible</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Transferir</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega Origen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bodega Destino</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {section.map((produto, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">{produto.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{produto.cantidad_disponible}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{produto.cantidad_transferir}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{produto.bodega}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{produto.bodega_destino}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Disponible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Transferir
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transferencia.productos.map((produto: Produto) => (
                <tr key={produto.transferencia_productos_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{produto.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{produto.cantidad_disponible}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{produto.cantidad_transferir}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConfirmarTransferencia;