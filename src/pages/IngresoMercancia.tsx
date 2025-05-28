import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from 'lucide-react';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  const { loading, getIngresoMercancia, getSources, exportIngresoExcel } = useIngresoMercanciaApi();
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [allIngresos, setAllIngresos] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  // New date range filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { exportWorksheet } = useExportWorksheet();

  // Fetch paginated records
  useEffect(() => {
    if (!searchTerm && filterEstado === "all" && !startDate && !endDate) {
      fetchIngresos();
    }
  }, [currentPage, searchTerm, filterEstado, startDate, endDate]);

  // Fetch all records for search/filtering purposes.
  useEffect(() => {
    fetchAllIngresos();
    fetchSources();
  }, []);

  const fetchIngresos = async () => {
    const response = await getIngresoMercancia(currentPage, pageSize);
    setIngresos(response.items);
    setTotalCount(response.total_count);
  };

  const fetchAllIngresos = async () => {
    // Fetch all records using a large pageSize
    const response = await getIngresoMercancia(1, 10000);
    setAllIngresos(response.items);
  };

  const fetchSources = async () => {
    const sourcesData = await getSources();
    setSources(sourcesData);
  };

  const getSourceName = (sourceCode: string) => {
    const source = sources.find((s) => s.source_code === sourceCode);
    return source ? source.name : sourceCode;
  };

  const handleNewClick = () => {
    navigate("/dashboard/ingreso-mercancia/nuevo");
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} active={i === currentPage}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  // Determine which ingresos to show:
  // If any filters (search, estado or date range) are active use the full list
  const filteredIngresos =
    searchTerm || filterEstado !== "all" || startDate || endDate
      ? allIngresos.filter((ingreso) => {
          // Filter by search and estado
          const matchSearch =
            ingreso.consecutivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ingreso.nombre_responsable.toLowerCase().includes(searchTerm.toLowerCase());
          const matchEstado = filterEstado === "all" || ingreso.estado === filterEstado;
          let matchDate = true;
          // Date filtering: convert ingreso.fecha ("YYYY-MM-DD HH:mm:ss") to valid ISO format
          const ingresoDate = new Date(ingreso.fecha.replace(" ", "T"));
          const ingresoDateOnly = ingresoDate.toISOString().split("T")[0];
          
          // Validate that the start date is not greater than the end date
          if (startDate && endDate && startDate > endDate) {
            matchDate = false;
          }
          if (startDate) {
            matchDate = matchDate && ingresoDateOnly >= startDate;
          }
          if (endDate) {
            matchDate = matchDate && ingresoDateOnly <= endDate;
          }

          return matchSearch && matchEstado && matchDate;
        })
      : ingresos;

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
          table: data.table,
        };
        exportWorksheet(
          worksheetData,
          `IngresoMercancia_${data.header.consecutivo}.xlsx`,
          ["SKU", "Cantidad", "Bodega"]
        );
        toast.success("Exportación exitosa");
      } else {
        toast.error("No se encontraron datos para exportar");
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error("Error al exportar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Ingreso de Mercancías</h1>
          <p className="text-muted-foreground">
            Gestione el ingreso de mercancías en el sistema
          </p>
        </div>
        <div>
          <Button
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
            onClick={handleNewClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ingreso
          </Button>
        </div>
      </div>
      {/* Search, estado and date filters */}
      <div className="flex gap-4 items-center mt-4">
        <input
          type="text"
          placeholder="Buscar por consecutivo o responsable"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded p-2"
        />
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">Todos los estados</option>
          <option value="n">Nuevo</option>
          <option value="p">Procesando</option>
          <option value="c">Completado</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded p-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded p-2"
        />
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("");
            setFilterEstado("all");
            setStartDate("");
            setEndDate("");
          }}
          className="border rounded p-2"
        >
          Reiniciar filtros
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
              {filteredIngresos.length > 0 ? (
                filteredIngresos.map((ingreso) => (
                  <TableRow
                    key={ingreso.ingresomercancia_id}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>{ingreso.consecutivo}</TableCell>
                    <TableCell>{getSourceName(ingreso.source)}</TableCell>
                    <TableCell>{ingreso.nombre_responsable}</TableCell>
                    <TableCell>{ingreso.descripcion || "-"}</TableCell>
                    <TableCell>{format(new Date(ingreso.fecha), "dd/MM/yyyy")}</TableCell>
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
                        variant="ghost" 
                        size="sm"
                        title="Ver registro"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/ingreso-mercancia/${ingreso.ingresomercancia_id}`);
                        }}
                      >
                       <Edit className="h-4 w-4" />
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No se encontraron ingresos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {!(searchTerm || filterEstado !== "all" || startDate || endDate) &&
            totalPages > 1 && (
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