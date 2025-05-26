import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { toast } from "sonner";
import { useExportWorksheet } from "@/hooks/useExportWorksheet";

interface ScannedItem {
  sku: string;
  position: string;
  quantity: number;
}

interface IngresoMercancia {
  ingresomercancia_id: string;
  source: string;
  creador: string;
  fecha: string;
  consecutivo: string;
  estado: string;
  nombre_responsable: string;
  productos: Array<{
    ingreso_mercancia_producto_id: string;
    ingreso_mercancia_id: string;
    producto: string;
    sku: string;
    cantidad: string;
    bodega_id: string;
    bodega_nombre: string;
  }>;
}

interface IngresoMercanciaResponse {
  items: IngresoMercancia[];
  search_criteria: {
    filter_groups: Array<{
      filters: Array<{
        field: string;
        value: string;
        condition_type: string;
      }>;
    }>;
  };
  total_count: number;
}

const IngresoMercanciaVerificacion = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [scannedItems] = useState<ScannedItem[]>(location.state?.scannedItems || []);
  const [ingreso, setIngreso] = useState<IngresoMercancia | null>(null);

  const { loading, getIngresoById, confirmarIngresoMercancia ,exportIngresoExcel} = useIngresoMercanciaApi();

  useEffect(() => {
    if (id) {
      fetchIngreso();
    }
  }, [id]);

  const fetchIngreso = async () => {
    const data = await getIngresoById(Number(id));
    if (data?.items?.[0]) {
      setIngreso(data.items[0]);
    }
  };

  const getTotalByPosition = () => {
    const totals: { [key: string]: number } = {};
    scannedItems.forEach(item => {
      totals[item.position] = (totals[item.position] || 0) + item.quantity;
    });
    return totals;
  };

  const handleConfirmar = async () => {
    if (!ingreso) return;

    const success = await confirmarIngresoMercancia(
      ingreso.ingresomercancia_id,
      ingreso.source
    );
    
    if (success) {
      toast.success("Ingreso confirmado, y guardado correctamente");
      navigate('/dashboard/ingreso-mercancia');
    }
  };
   const { exportWorksheet } = useExportWorksheet();

  const handleExport = async (ingresoId: number) => {
    try {
      const result = await exportIngresoExcel(ingresoId);
      if (result && result.length > 0) {
        const data = result[0];
        const worksheetData = {
          header: {
            "Source": data.header.source,
            "Fecha": data.header.fecha,
            "Consecutivo": data.header.consecutivo,
            "Responsable": data.header.nombre_responsable,
            "Descripción": data.header.descripcion || ""
          },
          table: data.table
        };
        // Export the worksheet as an Excel file with custom table headers.
        exportWorksheet(worksheetData, `IngresoMercancia_${ingresoId}.xlsx`, ["SKU", "Cantidad", "Bodega"]);
        toast.success("Exportación exitosa");
      } else {
        toast.error("No se encontraron datos para exportar");
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error("Error al exportar");
    }
  };

  if (loading || !ingreso) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalByPosition = getTotalByPosition();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verificación - Confirmar Proceso de Ingreso</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/ingreso-mercancia/'+ingreso.ingresomercancia_id)}
          >
            Regresar
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleExport(Number(ingreso.ingresomercancia_id));
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9" />
            </svg>
            Exportar a Excel
          </Button>
          <Button 
            onClick={handleConfirmar}
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
          >
            Confirmar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Total de Elementos Escaneados</h2>
            <p className="text-4xl font-bold">
              {scannedItems.reduce((total, item) => total + item.quantity, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Total por Posición</h2>
            <div className="space-y-2">
              {Object.entries(totalByPosition).map(([position, total]) => (
                <div key={position} className="flex justify-between items-center">
                  <span className="font-medium">{position}:</span>
                  <span>{total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">SKU</th>
                <th className="text-left py-2">Posición</th>
                <th className="text-left py-2">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {scannedItems.map((item, index) => (
                <tr key={`${item.sku}-${item.position}-${index}`} className="border-b">
                  <td className="py-2">{item.sku}</td>
                  <td className="py-2">{item.position}</td>
                  <td className="py-2">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresoMercanciaVerificacion; 