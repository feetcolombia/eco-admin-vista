import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";

const ListarBodegas = () => {
  const { getSources, getBodegas, loading } = useIngresoMercanciaApi();
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [bodegas, setBodegas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSources() {
      const data = await getSources();
      setSources(data);
      if (data.length > 0) setSelectedSource(data[0].source_code);
    }
    fetchSources();
  }, []);

  useEffect(() => {
    if (!selectedSource) return;
    async function fetchBodegas() {
      const data = await getBodegas(selectedSource);
      setBodegas(data);
      setCurrentPage(1); // Reset para a primeira página ao mudar de source
    }
    fetchBodegas();
  }, [selectedSource]);

  // Resetar para a primeira página ao buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredBodegas = bodegas.filter((bodega) =>
    bodega.bodega_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular paginação
  const totalItems = filteredBodegas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredBodegas.slice(startIndex, endIndex);

  const columns = [
    { header: "Nome", accessor: "bodega_nombre" },
    { header: "Altura", accessor: "bodega_altura" },
    { header: "Largura", accessor: "bodega_largo" },
    { header: "Profundidade", accessor: "bodega_profundidad" },
    { header: "Limite", accessor: "bodega_limite" },
  ];

  const actions = [
    {
      icon: <Eye className="h-4 w-4" />, onClick: (bodega) => {}, variant: "ghost" as const
    },
    {
      icon: <Pencil className="h-4 w-4" />, onClick: (bodega) => {}, variant: "ghost" as const
    },
    {
      icon: <Trash2 className="h-4 w-4" />, onClick: (bodega) => {}, variant: "ghost" as const, colorClass: "text-red-500 hover:text-red-600"
    },
  ];

  // Gerar array de páginas a exibir
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Mostrar todas as páginas se forem poucas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Lógica para mostrar páginas com elipses
      if (currentPage <= 3) {
        // Primeiras páginas
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Últimas páginas
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Páginas do meio
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }
    
    return pageNumbers;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bodegas</h1>
          <p className="text-muted-foreground">Administre as bodegas do sistema</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => navigate("/dashboard/bodegas/nova")}
        >
          <Plus className="h-4 w-4" />
          Nueva Posición
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
            <select
              className="border rounded px-3 py-2 max-w-xs mb-2 md:mb-0"
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
            >
              {sources.map((source) => (
                <option key={source.source_code} value={source.source_code}>
                  {source.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <DataTable
            data={currentItems}
            columns={columns}
            actions={actions}
          />
          
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-sm text-center text-gray-500 mt-2">
                Mostrando {startIndex + 1}-{endIndex} de {totalItems} bodegas
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListarBodegas; 