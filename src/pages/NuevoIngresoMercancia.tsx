import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { format } from "date-fns";

interface Source {
  source_code: string;
  name: string;
}

const NuevoIngresoMercancia = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [responsable, setResponsable] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const { loading, getSources, createIngresoMercancia } = useIngresoMercanciaApi();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const data = await getSources();
    setSources(data);
  };

  const handleSubmit = async () => {
    if (!selectedSource || !responsable) {
      return;
    }

    const data = {
      source: selectedSource,
      creador: 1, // TODO: Pegar o ID do usuário logado
      fecha: new Date().toISOString(),
      nombre_responsable: responsable,
      descripcion: descripcion,
    };

    const result = await createIngresoMercancia(data);
    if (result) {
      navigate(`/ingreso-mercancia/${result.ingresomercancia_id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Novo Processo de Ingresso</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-100"
            onClick={() => navigate(-1)}
          >
            Voltar
          </Button>
          <Button
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
            onClick={handleSubmit}
          >
            Salvar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="source" className="text-sm font-medium">
              Origem<span className="text-red-500">*</span>
            </Label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.source_code} value={source.source_code}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha" className="text-sm font-medium">
              Data<span className="text-red-500">*</span>
            </Label>
            <Input
              id="fecha"
              type="text"
              value={format(new Date(), "dd/MM/yyyy")}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsable" className="text-sm font-medium">
              Usuário Responsável<span className="text-red-500">*</span>
            </Label>
            <Input
              id="responsable"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Digite o nome do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-sm font-medium">
              Descrição
            </Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Digite uma descrição para o ingresso"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NuevoIngresoMercancia; 