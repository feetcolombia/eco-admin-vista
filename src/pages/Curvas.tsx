import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NovaCurvaModal } from "@/components/curvas/NovaCurvaModal";

interface Curva {
  curva_producto_id: string;
  nombre: string;
  descripcion: string;
}

const Curvas = () => {
  const [curvas, setCurvas] = useState<Curva[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCurvas();
  }, []);

  const fetchCurvas = async () => {
    try {
      const response = await fetch("https://stg.feetcolombia.com/rest/V1/feetproductos-curva/getcurvas");
      const data = await response.json();
      setCurvas(data);
    } catch (error) {
      console.error("Erro ao buscar curvas:", error);
    }
  };

  const filteredCurvas = curvas.filter((curva) =>
    curva.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curva.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tipos de Curva</CardTitle>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipo de Curva
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurvas.map((curva) => (
                <TableRow key={curva.curva_producto_id}>
                  <TableCell>{curva.nombre}</TableCell>
                  <TableCell>{curva.descripcion}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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