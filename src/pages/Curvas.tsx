import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { NovaCurvaModal } from "@/components/curvas/NovaCurvaModal";
import { ConfirmDeleteModal } from "@/components/curvas/ConfirmDeleteModal";
import { useCurvasApi } from "@/hooks/useCurvasApi";
import type { CurvaLista } from "@/hooks/useCurvasApi";

const Curvas = () => {
  const [curvas, setCurvas] = useState<CurvaLista[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurvaId, setSelectedCurvaId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [curvaToDelete, setCurvaToDelete] = useState<CurvaLista | null>(null);
  const { loading, getCurvas, deleteCurva } = useCurvasApi();

  useEffect(() => {
    fetchCurvas();
  }, []);

  const fetchCurvas = async () => {
    const data = await getCurvas();
    setCurvas(data);
  };

  const filteredCurvas = curvas.filter((curva) =>
    (curva?.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (curva?.descripcion?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (curva: CurvaLista) => {
    setCurvaToDelete(curva);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (curvaToDelete) {
      const success = await deleteCurva(curvaToDelete.curva_producto_id);
      if (success) {
        fetchCurvas();
      }
    }
    setIsDeleteModalOpen(false);
    setCurvaToDelete(null);
  };

  const columns = [
    { header: "Nombre", accessor: "nombre" as keyof CurvaLista },
    { header: "Descripción", accessor: "descripcion" as keyof CurvaLista },
  ];

  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      onClick: (curva: CurvaLista) => setSelectedCurvaId(curva.curva_producto_id),
      variant: "ghost" as const,
    },
    {
      icon: <Pencil className="h-4 w-4" />,
      onClick: (curva: CurvaLista) => setSelectedCurvaId(curva.curva_producto_id),
      variant: "ghost" as const,
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (curva: CurvaLista) => handleDelete(curva),
      variant: "ghost" as const,
      colorClass: "text-red-500 hover:text-red-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Curva</h1>
          <p className="text-muted-foreground">
            Administre los tipos de curva del sistema
          </p>
        </div>
        <Button 
          className="bg-ecommerce-500 hover:bg-ecommerce-600"
          onClick={() => {
            setSelectedCurvaId(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" /> Nuevo Tipo de Curva
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <DataTable
            data={filteredCurvas}
            columns={columns}
            actions={actions}
          />
        </CardContent>
      </Card>

      <NovaCurvaModal
        isOpen={isModalOpen || !!selectedCurvaId}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCurvaId(null);
        }}
        onSuccess={fetchCurvas}
        curvaId={selectedCurvaId}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurvaToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={curvaToDelete?.nombre || ""}
      />
    </div>
  );
};

export default Curvas; 