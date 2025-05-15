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
import { Plus, Eye } from 'lucide-react';
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
import { Loader2 } from 'lucide-react';

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
      setTransferencias(data.items);
      setTotalCount(data.total_count);
      setTotalPages(Math.ceil(data.total_count / data.page_size));
    }
    } catch (error) {
      console.error('Erro ao buscar transferências:', error);
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'n':
        return 'Nuevo';
      case 'f':
        return 'Finalizado';
      case 'c':
        return 'Contando';
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
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="n">Nuevo</SelectItem>
            <SelectItem value="f">Finalizado</SelectItem>
            <SelectItem value="c">Contando</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Bodega Origen</TableHead>
              <TableHead>Bodega Destino</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Es Masiva</TableHead>     
              <TableHead>Histórico</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
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
                <TableCell>{transferencia.soruce}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transferencia.estado)}`}>
                    {getStatusText(transferencia.estado)}
                  </span>
                </TableCell>
                <TableCell>{transferencia.nombre_bodega_origen}</TableCell>
                <TableCell>{transferencia.nombre_bodega_destino}</TableCell>
                <TableCell>{transferencia.nombre_responsable}</TableCell>
                <TableCell>{transferencia.es_masiva == 'n' ? 'No' : 'Si'}</TableCell>          
                <TableCell>{transferencia.historico === 'n' || transferencia.historico == null ? 'No' : 'Si'}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewDetails(transferencia.transferencia_bodega_id)}
                  >
                    <Eye className="h-4 w-4" />
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