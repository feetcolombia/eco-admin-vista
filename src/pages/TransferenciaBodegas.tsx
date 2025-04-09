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

  return (
    <div className="container mx-auto py-6">
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

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          Página {currentPage} de {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransferenciaBodegas; 