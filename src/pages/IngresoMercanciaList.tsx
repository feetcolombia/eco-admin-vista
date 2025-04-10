import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { format } from "date-fns";

const IngresoMercanciaList = () => {
  const [ingresos, setIngresos] = useState([]);

  useEffect(() => {
    // Fetch ingresos data
    // This is a placeholder and should be replaced with actual data fetching logic
    setIngresos([
      {
        ingresomercancia_id: 1,
        consecutivo: "001",
        source: "Origen 1",
        fecha: "2024-04-01T10:00:00",
        nombre_responsable: "Usuario Responsable 1",
        estado: "n",
        productos: [],
      },
      {
        ingresomercancia_id: 2,
        consecutivo: "002",
        source: "Origen 2",
        fecha: "2024-04-02T11:00:00",
        nombre_responsable: "Usuario Responsable 2",
        estado: "p",
        productos: [],
      },
      {
        ingresomercancia_id: 3,
        consecutivo: "003",
        source: "Origen 3",
        fecha: "2024-04-03T12:00:00",
        nombre_responsable: "Usuario Responsable 3",
        estado: "c",
        productos: [],
      },
    ]);
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Consecutivo</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Produtos</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingresos.map((ingreso) => (
          <TableRow key={ingreso.ingresomercancia_id}>
            <TableCell>{ingreso.ingresomercancia_id}</TableCell>
            <TableCell>{ingreso.consecutivo}</TableCell>
            <TableCell>{ingreso.source}</TableCell>
            <TableCell>{ingreso.nombre_responsable}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{ingreso.productos?.length || 0}</span>
              </div>
            </TableCell>
            <TableCell>
              {format(new Date(ingreso.fecha), "dd/MM/yyyy")}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  ingreso.estado === "n"
                    ? "default"
                    : ingreso.estado === "p"
                    ? "secondary"
                    : "outline"
                }
                className={
                  ingreso.estado === "n"
                    ? "bg-gray-100 text-gray-800"
                    : ingreso.estado === "p"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {ingreso.estado === "n"
                  ? "Nuevo"
                  : ingreso.estado === "p"
                  ? "Procesando"
                  : "Completado"}
              </Badge>
            </TableCell>
            <TableCell>
              {/* Add actions column content here */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default IngresoMercanciaList; 