import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { NovaCurvaModal } from "@/components/curvas/NovaCurvaModal";
import { useCurvasApi } from "@/hooks/useCurvasApi";

interface Curva {
  curva_producto_id: string;
  nombre: string;
  descripcion: string;
}

const Curvas = () => {
  const [curvas, setCurvas] = useState<Curva[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loading, getCurvas } = useCurvasApi();

  useEffect(() => {
    fetchCurvas();
  }, []);

  const fetchCurvas = async () => {
    const data = await getCurvas();
    setCurvas(data);
  };

  const filteredCurvas = curvas.filter((curva) =>
    curva.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curva.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: "Nome", accessor: "nombre" as keyof Curva },
    { header: "Descrição", accessor: "descripcion" as keyof Curva },
  ];

  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      onClick: (curva: Curva) => console.log("Ver", curva),
      variant: "ghost" as const,
    },
    {
      icon: <Pencil className="h-4 w-4" />,
      onClick: (curva: Curva) => console.log("Editar", curva),
      variant: "ghost" as const,
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (curva: Curva) => console.log("Excluir", curva),
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
            Gerencie os tipos de curva do sistema
          </p>
        </div>
        <Button 
          className="bg-ecommerce-500 hover:bg-ecommerce-600"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} className="mr-2" /> Novo Tipo de Curva
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCurvas}
      />
    </div>
  );
};

export default Curvas; 