import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { Eye, Pencil, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BodegaDetalhes {
  bodega_id: number;
  bodega_source: string;
  bodega_nombre: string;
  bodega_descripcion: string;
  bodega_altura: number;
  bodega_largo: number;
  bodega_profundidad: number;
  bodega_limite: number;
}

const ListarBodegas = () => {
  const { getSources, getBodegas, getBodegaById, updateBodega, loading } = useIngresoMercanciaApi();
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [bodegas, setBodegas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBodega, setSelectedBodega] = useState<BodegaDetalhes | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBodega, setEditedBodega] = useState<BodegaDetalhes | null>(null);
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

  const handleViewBodega = async (bodegaId: number, shouldEdit: boolean = false) => {
    const bodega = await getBodegaById(bodegaId);
    if (bodega) {
      setSelectedBodega(bodega);
      setEditedBodega(bodega); // Garantir que editedBodega também seja preenchido
      setIsViewModalOpen(true);
      if (shouldEdit) {
        setIsEditing(true);
      }
    }
  };

  const handleEditClick = () => {
    setEditedBodega(selectedBodega);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedBodega(null);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editedBodega) return;

    const success = await updateBodega(editedBodega.bodega_id, {
      bodega: {
        bodega_nombre: editedBodega.bodega_nombre,
        bodega_descripcion: editedBodega.bodega_descripcion,
        bodega_altura: editedBodega.bodega_altura,
        bodega_largo: editedBodega.bodega_largo,
        bodega_profundidad: editedBodega.bodega_profundidad,
        bodega_limite: editedBodega.bodega_limite,
      }
    });

    if (success) {
      toast.success("Bodega atualizada com sucesso!");
      setIsEditing(false);
      // Atualizar a lista de bodegas
      if (selectedSource) {
        const data = await getBodegas(selectedSource);
        setBodegas(data);
      }
      // Atualizar os detalhes da bodega
      const updatedBodega = await getBodegaById(editedBodega.bodega_id);
      if (updatedBodega) {
        setSelectedBodega(updatedBodega);
      }
    }
  };

  const handleInputChange = (field: keyof BodegaDetalhes, value: string | number) => {
    if (!editedBodega) return;
    setEditedBodega(prev => prev ? { ...prev, [field]: value } : null);
  };

  const columns = [
    { header: "Nome", accessor: "bodega_nombre" },
    { header: "Altura", accessor: "bodega_altura" },
    { header: "Largura", accessor: "bodega_largo" },
    { header: "Profundidade", accessor: "bodega_profundidad" },
    { header: "Limite", accessor: "bodega_limite" },
  ];

  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      onClick: (bodega) => handleViewBodega(bodega.bodega_id, false),
      variant: "ghost" as const,
      tooltip: "Visualizar"
    },
    {
      icon: <Pencil className="h-4 w-4" />,
      onClick: (bodega) => handleViewBodega(bodega.bodega_id, true),
      variant: "ghost" as const,
      tooltip: "Editar"
    }
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
      
      <Dialog open={isViewModalOpen} onOpenChange={(open) => {
        setIsViewModalOpen(open);
        if (!open) {
          setIsEditing(false);
          setEditedBodega(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Detalhes da Bodega</span>
              {!isEditing && selectedBodega && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditClick}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedBodega && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">ID:</div>
                <div className="col-span-3">{selectedBodega.bodega_id}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Source:</div>
                <div className="col-span-3">{selectedBodega.bodega_source}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Nome:</div>
                <div className="col-span-3">
                  {isEditing ? (
                    <Input
                      value={editedBodega?.bodega_nombre || ''}
                      onChange={(e) => handleInputChange('bodega_nombre', e.target.value)}
                    />
                  ) : (
                    selectedBodega.bodega_nombre
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Descrição:</div>
                <div className="col-span-3">
                  {isEditing ? (
                    <Textarea
                      value={editedBodega?.bodega_descripcion || ''}
                      onChange={(e) => handleInputChange('bodega_descripcion', e.target.value)}
                    />
                  ) : (
                    selectedBodega.bodega_descripcion
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Altura:</div>
                <div className="col-span-3">
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editedBodega?.bodega_altura || ''}
                      onChange={(e) => handleInputChange('bodega_altura', parseFloat(e.target.value))}
                    />
                  ) : (
                    `${selectedBodega.bodega_altura}m`
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Largura:</div>
                <div className="col-span-3">
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editedBodega?.bodega_largo || ''}
                      onChange={(e) => handleInputChange('bodega_largo', parseFloat(e.target.value))}
                    />
                  ) : (
                    `${selectedBodega.bodega_largo}m`
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Profundidade:</div>
                <div className="col-span-3">
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editedBodega?.bodega_profundidad || ''}
                      onChange={(e) => handleInputChange('bodega_profundidad', parseFloat(e.target.value))}
                    />
                  ) : (
                    `${selectedBodega.bodega_profundidad}m`
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Limite:</div>
                <div className="col-span-3">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedBodega?.bodega_limite || ''}
                      onChange={(e) => handleInputChange('bodega_limite', parseInt(e.target.value))}
                    />
                  ) : (
                    selectedBodega.bodega_limite
                  )}
                </div>
              </div>
            </div>
          )}
          {isEditing && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListarBodegas; 