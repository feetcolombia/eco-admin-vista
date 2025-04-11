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

const TransferenciaBodegas = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [transferencias, setTransferencias] = useState<TransferenciaBodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchTransferencias();
  }, [currentPage, searchTerm, selectedStatus]);

  const fetchTransferencias = async () => {
    try {
      const response = await fetch(
        `https://stg.feetcolombia.com/rest/V1/transferenciabodegas/list?currentPage=${currentPage}&pageSize=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const [success, data] = await response.json();
      if (success) {
        setTransferencias(data.items);
        setTotalPages(Math.ceil(data.total_count / data.page_size));
      }
    } catch (error) {
      console.error('Erro ao buscar transferências:', error);
    } finally {
      setLoading(false);
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
        return 'Novo';
      case 'f':
        return 'Finalizado';
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

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transferência entre Bodegas</h1>
        <Button 
          className="bg-ecommerce-500 hover:bg-ecommerce-600"
          onClick={() => navigate('/dashboard/transferencia-mercancia/novo')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Transferência
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Buscar por código ou responsável..."
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
            <SelectItem value="n">Novo</SelectItem>
            <SelectItem value="f">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Histórico</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transferencias.map((transferencia) => (
              <TableRow key={transferencia.transferencia_bodega_id}>
                <TableCell className="font-medium">{transferencia.codigo}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transferencia.estado)}`}>
                    {getStatusText(transferencia.estado)}
                  </span>
                </TableCell>
                <TableCell>{transferencia.nombre_bodega_origen}</TableCell>
                <TableCell>{transferencia.nombre_bodega_destino}</TableCell>
                <TableCell>{transferencia.nombre_responsable}</TableCell>
                <TableCell>Normal</TableCell>
                <TableCell>{transferencia.soruce}</TableCell>
                <TableCell>{transferencia.historico === 'n' ? 'Não' : 'Sim'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
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