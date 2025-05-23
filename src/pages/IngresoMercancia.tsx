import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { format } from "date-fns";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { useExportWorksheet } from "@/hooks/useExportWorksheet";
interface Source {
  source_code: string;
  name: string;
  enabled: boolean;
  description?: string;
  extension_attributes: {
    is_pickup_location_active: boolean;
    frontend_name: string;
  };
}

const IngresoMercancia = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { loading, getIngresoMercancia, getSources,exportIngresoExcel } = useIngresoMercanciaApi();
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    fetchIngresos();
    fetchSources();
  }, [currentPage]);

  const fetchIngresos = async () => {
    const response = await getIngresoMercancia(currentPage, pageSize);
    setIngresos(response.items);
    setTotalCount(response.total_count);
  };

  const fetchSources = async () => {
    const sourcesData = await getSources();
    setSources(sourcesData);
  };

  const getSourceName = (sourceCode: string) => {
    const source = sources.find(s => s.source_code === sourceCode);
    return source ? source.name : sourceCode;
  };

  const handleNewClick = () => {
    navigate('/dashboard/ingreso-mercancia/nuevo');
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
           //"Estado": data.header.estado,
           "Descripción": data.header.descripcion || ""
         },
         table: data.table
       };
       // Call the hook's exportWorksheet function with custom table headers.
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

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  const { exportWorksheet } = useExportWorksheet();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Ingreso de Mercancías</h1>
          <p className="text-muted-foreground">
            Gestione el ingreso de mercancías en el sistema
          </p>
        </div>
        <Button 
          className="bg-ecommerce-500 hover:bg-ecommerce-600"
          onClick={handleNewClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ingreso
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consecutivo</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
                <TableHead>Exportar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingresos.length > 0 ? (
                ingresos.map((ingreso) => (
                  <TableRow
                      key={ingreso.ingresomercancia_id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>{ingreso.consecutivo}</TableCell>
                      <TableCell>{getSourceName(ingreso.source)}</TableCell>
                      <TableCell>{ingreso.nombre_responsable}</TableCell>
                      <TableCell>{ingreso.descripcion || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(ingreso.fecha), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            ingreso.estado === "n"
                              ? "bg-blue-100 text-blue-800"
                              : ingreso.estado === "p"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {ingreso.estado === "n"
                            ? "Nuevo"
                            : ingreso.estado === "p"
                            ? "Procesando"
                            : "Completado"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/ingreso-mercancia/${ingreso.ingresomercancia_id}`);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!(ingreso.estado === "c" || ingreso.estado === "p")} 
                          className={`flex items-center gap-1 text-green-600 hover:text-green-800 ${
                            !(ingreso.estado === "c" || ingreso.estado === "p") ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(ingreso.ingresomercancia_id);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No se encontraron ingresos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresoMercancia;
