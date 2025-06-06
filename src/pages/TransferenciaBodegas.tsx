import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransferenciaBodega, TransferenciaBodegaResponse } from '@/api/types/transferTypes';
import { Plus, Edit,Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { transferBodegasApi,Source } from '@/api/transferBodegasApi';
import { useExportWorksheet } from "@/hooks/useExportWorksheet";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { format } from "date-fns";

const TransferenciaBodegas = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [transferencias, setTransferencias] = useState<TransferenciaBodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const { exportWorksheet } = useExportWorksheet();
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);


  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // reinicia página al cambiar filtro o buscador
    useEffect(() => {
      setCurrentPage(1);
    }, [selectedStatus]);

  useEffect(() => {
      const handler = setTimeout(() => {
        if (searchTerm.trim()) {
          setIsFetchingAll(true);
          fetchAllTransferencias();
        } else {
          fetchTransferencias();
        }
      }, 300);
  
      return () => clearTimeout(handler);
    }, [searchTerm, selectedStatus]);

   useEffect(() => {
       // sólo paginación si no hay búsqueda activa
       if (!searchTerm.trim()) {
         fetchTransferencias();
       }
     }, [currentPage]);

     const fetchTransferencias = async () => {
      try {
        const [success, data] = await transferBodegasApi.list(currentPage, 10);
        if (success) {
          // Si se selecciona un estado distinto de "all", filtramos en el cliente,
          // pero usamos el total_count de la API para la paginación.
          let items = data.items;
          if (selectedStatus !== "all") {
            items = items.filter(item => item.estado.toLowerCase() === selectedStatus);
          }
          setTransferencias(items);
          setTotalCount(data.total_count); // Usamos el total_count que provee la API
          setTotalPages(Math.ceil(data.total_count / 10)); // Fijamos 10 registros por página
        }
      } catch (error) {
        console.error("Erro ao buscar transferências:", error);
      } finally {
        setLoading(false);
      }
    };

  const fetchAllTransferencias = async () => {
      try {
        const [success, data] = await transferBodegasApi.list(1, totalCount || 100000);
        if (success) {
          setTransferencias(data.items);
        }
      } catch (error) {
        console.error('Erro ao buscar todas para búsqueda:', error);
      } finally {
        setLoading(false);
        setIsFetchingAll(false);
      }
    };

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'n':
        return 'bg-blue-100 text-blue-800';
      case 'f':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'n':
        return 'Nuevo';
      case 'f':
        return 'Completado';
      case 'c':
        return 'Procesando';
      case 'p':
      return 'Procesando';
      default:
        return 'Desconhecido';
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
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
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
            onClick={() => setCurrentPage(i)}
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
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const handleViewDetails = async (id: string) => {
    try {
        const [success, data] = await transferBodegasApi.getById(id,token);
        if (success) {
          navigate(`/dashboard/transferencia-mercancia/${id}`, {
            state: { transferencia: data }
          });
        }
      } catch (error) {
        console.error('Error al obtener detalles de la transferencia:', error);
      }
  };

  const filtered = transferencias.filter(t => {
    const matchesSearch =
      t.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nombre_responsable.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || t.estado.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const isSearching = searchTerm.trim().length > 0;
  const displayed = filtered;  
  const handleExport = async (transferenciaId: number) => {
    try {
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

        // Pass the header names accordingly
        exportWorksheet(
          worksheetData,
          `TransferenciaBodega_${data.header.codigo}.xlsx`,
          ["SKU", "Cantidad Transferir", "Cantidad Disponible", "Observación", "Bodega Origen", "Bodega Destino"]
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
    <div className="overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transferencia entre Bodegas</h1>
        <Button 
          className="bg-ecommerce-500 hover:bg-ecommerce-600"
          onClick={() => navigate('/dashboard/transferencia-mercancia/novo')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Transferencia
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Buscar por código o responsable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={selectedStatus}
          onValueChange={setSelectedStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="n">Nuevo</SelectItem>
            <SelectItem value="f">Completado</SelectItem>
            <SelectItem value="c">Procesando</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>             
              <TableHead>Fecha</TableHead>
              <TableHead>Responsable</TableHead> 
              <TableHead>Origen</TableHead>            
              <TableHead>Bodega Origen</TableHead>
              <TableHead>Bodega Destino</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Es Masiva</TableHead>     
              <TableHead>Histórico</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
              <TableHead>Exportar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
       {isFetchingAll ? (
         <TableRow>
           <TableCell colSpan={9} className="text-center py-4">
             <Loader2 className="inline-block animate-spin mr-2" />
             Cargando resultados...
           </TableCell>
         </TableRow>
       ) : (
         displayed.map((transferencia) => (
              <TableRow key={transferencia.transferencia_bodega_id}>
                <TableCell className="font-medium">{transferencia.codigo}</TableCell>
                <TableCell>{format(new Date(transferencia.fecha), "dd/MM/yyyy")}</TableCell>
                <TableCell>{transferencia.nombre_responsable}</TableCell>
                <TableCell>{transferencia.soruce}</TableCell>               
                <TableCell>{transferencia.nombre_bodega_origen}</TableCell>
                <TableCell>{transferencia.nombre_bodega_destino}</TableCell>
                <TableCell>{transferencia.descripcion}</TableCell>   
                <TableCell>{transferencia.es_masiva == 'n' ? 'No' : 'Si'}</TableCell>          
                <TableCell>{transferencia.historico === 'n' || transferencia.historico == null ? 'No' : 'Si'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transferencia.estado)}`}>
                    {getStatusText(transferencia.estado)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="Ver registro"
                    onClick={() => handleViewDetails(transferencia.transferencia_bodega_id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Eliminar transferencia"
                    disabled={!(transferencia.estado === "p" || transferencia.estado === "n")}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("¿Está seguro de eliminar esta transferencia?")) {
                        transferBodegasApi.deleteTransferenciaBodega(Number(transferencia.transferencia_bodega_id))
                          .then((success) => {
                            if (success) {
                              toast.success("Transferencia eliminada exitosamente");
                              fetchTransferencias();
                            } else {
                              toast.error("Error al eliminar transferencia");
                            }
                          })
                          .catch((error) => {
                            console.error("Error al eliminar transferencia:", error);
                            toast.error("Error al eliminar transferencia");
                          });
                      }
                    }}
                  >
                  <Trash2
                    className="h-4 w-4 text-red-500"
                    style={{
                      opacity: !(transferencia.estado === "p" || transferencia.estado === "n") ? 0.5 : 1
                    }}
                  />
                  </Button>
                </TableCell>
                <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!(transferencia.estado === "p" || transferencia.estado === "c" || transferencia.estado === "f")}
                        className={`flex items-center gap-1 text-green-600 hover:text-green-800 ${
                          !(transferencia.estado === "p" || transferencia.estado === "c" || transferencia.estado === "f") ? "cursor-not-allowed opacity-50" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(Number(transferencia.transferencia_bodega_id));
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9" />
                        </svg>
                      </Button>
                    </TableCell>
              </TableRow>
                       ))
       )}
            
          </TableBody>
        </Table>
      </div>

      {!searchTerm.trim() && totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TransferenciaBodegas; 