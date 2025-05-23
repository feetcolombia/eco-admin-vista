import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Eye, Trash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { transferSourcesApi, TransferSource } from '@/api/transferSourcesApi';
import { useToast } from '@/components/ui/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useExportWorksheet } from '@/hooks/useExportWorksheet';
import { toast } from 'sonner';

const estadoLabel = { c: 'Contando', n: 'Nuevo', f: 'Completo' };

const TransferenciaSources = () => {
  const { token } = useAuth();
  const [items, setItems] = useState<TransferSource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { exportWorksheet } = useExportWorksheet();

  const fetchAll = async () => {
    try {
      const all = await transferSourcesApi.getAll();
      setItems(all);
    } catch (e) { console.error(e); }
  };

 const handleDelete = async (id: number) => {
     const ok = window.confirm(
       '¿Seguro desea eliminar este registro? Se perderá el proceso realizado hasta el momento.'
     );
     if (!ok) 
      return;
     try {
       const success = await transferSourcesApi.delete(id);
       if (!success) throw new Error('No se pudo eliminar');
       setItems(prev => prev.filter(x => x.transferencia_source_id !== id));
       toast({
        title: "Éxito",
        description: "Registro eliminado correctamente"
      });
     } catch (e) {
       console.error('Error al eliminar transferencia:', e);
     }
   };

  useEffect(() => { fetchAll() }, []);
  
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filtered = items.filter(x =>
    x.consecutivo.includes(searchTerm) ||
    x.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  
  const handleView = (src: TransferSource) => {
 
     if (['n', 'ic', 'if'].includes(src.tipo)) {
       navigate(`/transferenciaMercancia/sources/execute-transferencia-source/${src.transferencia_source_id}`);
     } else if (src.tipo === 'sc' || src.tipo === 'sf') {
       navigate(`/transferenciaMercancia/sources/execute-transferencia-source-ingreso/${src.transferencia_source_id}`);
     } else if (src.tipo === 'pf' && src.estado === 'f') {
       navigate(`/transferenciaMercancia/sources/confirm-transferencia-source/${src.transferencia_source_id}`);
     }
   };

   const handleExport = async (transferenciaId: number) => {
    try {
      const result = await transferSourcesApi.exportTransferenciaExcel(transferenciaId);
      if (result && result.length > 0) {
        const data = result[0];
        // Transform the ingreso table. (You can adjust this transformation or combine
        // table_ingreso and table_salida if needed.)
        console.log("data", data.table_salida);
        const transformedTableIngreso = data.table_ingreso.map((row: any) => ({
          SKU: row.sku,
          Cantidad: row.cantidad,
          Bodega: row.bodega_nombre,
        }));

        const transformedTableSalida = data.table_salida.map((row: any) => ({
          SKU: row.sku,
          Cantidad: row.cantidad,
          Bodega: row.bodega_nombre,
        }));
  
        const worksheetData = {
          header: { 
            "Source": data.header.source_origen,
            "Codigo": data.header.consecutivo,
            "Responsable": data.header.nombre_responsable,
            "Es másiva": data.header.es_masiva ? data.header.es_masiva : "",           
            "Descripción": data.header.descripcion || "",
            "Tipo": data.header.tipo == 'pf' ? 'Completo' : 'Contando'
          },
          table: transformedTableIngreso,
          tableDos: transformedTableSalida,
        };
  
        // Exporta usando el hook con las columnas deseadas.
        exportWorksheet(worksheetData, `TransferenciaSource_${transferenciaId}.xlsx`, 
          ["SKU", "Cantidad", "Bodega"]
        );
        toast({
          title: "Éxito",
          description: "Exportación exitosa"
        });
      } else {
        toast({
          title: "Error",
          description: "No se encontraron datos para exportar"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar"
      });
    }
  };

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transferencias entre sources</h1>
        <Button onClick={() => navigate('/new-transferencia-source')}>
      Nueva Transferencia
    </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Buscar consecutivo o descripción..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Consecutivo</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
              <TableHead>Exportar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(src => (
              <TableRow key={src.transferencia_source_id}>
                <TableCell>{src.consecutivo}</TableCell>
                <TableCell>{src.source_origen}</TableCell>
                <TableCell>{src.source_destino}</TableCell>
                <TableCell>{src.descripcion}</TableCell>
                <TableCell>{src.nombre_responsable}</TableCell>
                <TableCell>{src.fecha}</TableCell>
                <TableCell>{estadoLabel[src.estado]}</TableCell>
                <TableCell className="text-right space-x-2">
                          <Button
            variant="ghost"
            size="sm"
            title="Ver registro"
            onClick={() => handleView(src)}
          >
            <Eye className="h-4 w-4" />
          </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Eliminar registro"
                  disabled={src.tipo === 'pf' && src.estado === 'f'}
                  onClick={
                    src.tipo === 'pf' && src.estado === 'f'
                      ? undefined
                      : () => handleDelete(src.transferencia_source_id)
                  }
                >
                  <Trash
                    className="h-4 w-4 text-red-500"
                    style={{
                      opacity: src.tipo === 'pf' && src.estado === 'f' ? 0.5 : 1
                    }}
                  />
                </Button>
              </TableCell>
              <TableCell>
                     <Button
                       variant="outline"
                       size="sm"
                       disabled={!(src.estado === "c" || src.estado === "f")}
                       className={`flex items-center gap-1 text-green-600 hover:text-green-800 ${
                         !(src.estado === "c" || src.estado === "f")
                           ? "cursor-not-allowed opacity-50"
                           : ""
                       }`}
                       onClick={(e) => {
                         e.stopPropagation();
                         handleExport(src.transferencia_source_id);
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
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
        <div className="px-4 py-2 flex justify-end">
          <Pagination>
            <PaginationPrevious
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </PaginationPrevious>

            <PaginationContent>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNumber = i + 1;
                // show ellipsis for large number of pages
                if (
                  pageNumber !== 1 &&
                  pageNumber !== totalPages &&
                  Math.abs(pageNumber - page) > 2
                ) {
                  if (
                    (pageNumber < page && pageNumber !== 2) ||
                    (pageNumber > page && pageNumber !== totalPages - 1)
                  ) {
                    return <PaginationEllipsis key={pageNumber} />;
                  }
                }
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setPage(pageNumber)}
                      isActive={pageNumber === page}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            </PaginationContent>

            <PaginationNext
              onClick={() => {
                if (page !== totalPages) {
                  setPage(p => Math.min(totalPages, p + 1));
                }
              }}
            >
              Siguiente
            </PaginationNext>
          </Pagination>
        </div>
      )}
      </div>
    </div>
  );
};

export default TransferenciaSources;