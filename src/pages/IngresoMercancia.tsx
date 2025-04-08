import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { format } from "date-fns";

const IngresoMercancia = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { loading, getIngresoMercancia } = useIngresoMercanciaApi();
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchIngresos();
  }, [currentPage]);

  const fetchIngresos = async () => {
    const response = await getIngresoMercancia(currentPage, pageSize);
    setIngresos(response.items);
    setTotalCount(response.total_count);
  };

  const handleRowClick = (id: number) => {
    navigate(`/ingreso-mercancia/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Ingresso de Mercadorias</h1>
          <p className="text-muted-foreground">
            Gerencie o ingresso de mercadorias no sistema
          </p>
        </div>
        <Button className="bg-ecommerce-500 hover:bg-ecommerce-600">
          <Plus className="w-4 h-4 mr-2" />
          Novo Ingresso
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Consecutivo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingresos.length > 0 ? (
                ingresos.map((ingreso) => (
                  <TableRow
                    key={ingreso.ingresomercancia_id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(ingreso.ingresomercancia_id)}
                  >
                    <TableCell>{ingreso.ingresomercancia_id}</TableCell>
                    <TableCell>{ingreso.consecutivo}</TableCell>
                    <TableCell>{ingreso.source}</TableCell>
                    <TableCell>{ingreso.nombre_responsable}</TableCell>
                    <TableCell>
                      {format(new Date(ingreso.fecha), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          ingreso.estado === "n"
                            ? "bg-blue-100 text-blue-800"
                            : ingreso.estado === "p"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {ingreso.estado === "n"
                          ? "Novo"
                          : ingreso.estado === "p"
                          ? "Processando"
                          : "Completado"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhum ingresso encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngresoMercancia; 