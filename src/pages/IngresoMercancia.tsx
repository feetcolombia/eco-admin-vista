import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, FileEdit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface IngresoMercancia {
  ingresomercancia_id: number;
  source: string;
  creador: number;
  fecha: string;
  consecutivo: string;
  estado: string;
  nombre_responsable: string;
}

const PAGE_SIZE = 10;

const estadoMap = {
  'n': { label: 'Nuevo', class: 'bg-blue-500' },
  'p': { label: 'Procesando', class: 'bg-yellow-500' },
  'c': { label: 'Completado', class: 'bg-green-500' }
};

const IngresoMercancia = () => {
  const [ingresos, setIngresos] = useState<IngresoMercancia[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  const { loading, getIngresoMercancia } = useIngresoMercanciaApi();

  useEffect(() => {
    fetchIngresos();
  }, [currentPage]);

  const fetchIngresos = async () => {
    const data = await getIngresoMercancia(currentPage, PAGE_SIZE);
    setIngresos(data.items);
    setTotalCount(data.total_count);
  };

  const filteredIngresos = ingresos.filter((ingreso) => {
    const matchesSearch = 
      ingreso.consecutivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingreso.nombre_responsable.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = selectedSource === "all" || ingreso.source === selectedSource;
    const matchesStatus = selectedStatus === "all" || ingreso.estado === selectedStatus;

    return matchesSearch && matchesSource && matchesStatus;
  });

  const columns = [
    { 
      header: "Consecutivo", 
      accessor: "consecutivo" as keyof IngresoMercancia 
    },
    { 
      header: "Responsável", 
      accessor: "nombre_responsable" as keyof IngresoMercancia 
    },
    { 
      header: "Source", 
      accessor: "source" as keyof IngresoMercancia 
    },
    { 
      header: "Data", 
      accessor: (ingreso: IngresoMercancia) => format(new Date(ingreso.fecha), 'dd/MM/yyyy HH:mm')
    },
    {
      header: "Estado",
      accessor: (ingreso: IngresoMercancia) => (
        <Badge className={estadoMap[ingreso.estado as keyof typeof estadoMap]?.class || 'bg-gray-500'}>
          {estadoMap[ingreso.estado as keyof typeof estadoMap]?.label || 'Desconhecido'}
        </Badge>
      )
    }
  ];

  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      onClick: (ingreso: IngresoMercancia) => console.log("Ver", ingreso),
      variant: "ghost" as const,
    },
    {
      icon: <FileEdit className="h-4 w-4" />,
      onClick: (ingreso: IngresoMercancia) => console.log("Editar", ingreso),
      variant: "ghost" as const,
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (ingreso: IngresoMercancia) => console.log("Excluir", ingreso),
      variant: "ghost" as const,
      colorClass: "text-red-500 hover:text-red-600",
    },
  ];

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
          <h1 className="text-2xl font-bold">Ingreso de Mercancia</h1>
          <p className="text-muted-foreground">
            Gerencie os ingressos de mercadoria no sistema
          </p>
        </div>
        <Button className="bg-ecommerce-500 hover:bg-ecommerce-600">
          <Plus size={16} className="mr-2" /> Novo Ingreso
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex gap-4">
            <Input
              placeholder="Buscar por consecutivo ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="feet_502">Feet 502</SelectItem>
                <SelectItem value="feet_pares_sueltos">Pares Sueltos</SelectItem>
                <SelectItem value="feet_falabella">Falabella</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="n">Nuevo</SelectItem>
                <SelectItem value="p">Procesando</SelectItem>
                <SelectItem value="c">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={filteredIngresos}
            columns={columns}
            actions={actions}
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, totalCount)} de {totalCount} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresoMercancia; 