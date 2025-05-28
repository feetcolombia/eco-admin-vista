import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useIngresoMercanciaApi } from "@/hooks/useIngresoMercanciaApi";
import { toast } from "sonner";

const CriarBodega = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getSources, createBodega, getBodegas } = useIngresoMercanciaApi();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bodega_source: "",
    bodega_nombre: "",
    bodega_descripcion: "",
    bodega_altura: "",
    bodega_largo: "",
    bodega_profundidad: "",
    bodega_limite: ""
  });

  useEffect(() => {
    async function fetchSources() {
      const data = await getSources();
      setSources(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, bodega_source: data[0].source_code }));
      }
    }
    fetchSources();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar todas as posições da source selecionada
      const bodegas = await getBodegas(formData.bodega_source);
      // Verificar duplicidade de nome (case-insensitive, trim)
      const nomeNovo = formData.bodega_nombre.trim().toLowerCase();
      const nomeDuplicado = bodegas.some(
        (b) => b.bodega_nombre.trim().toLowerCase() === nomeNovo
      );
      if (nomeDuplicado) {
        toast.error("Já existe uma posição com esse nome nesta source!");
        setLoading(false);
        return;
      }
      const bodegaData = {
        bodega: {
          ...formData,
          bodega_altura: parseFloat(formData.bodega_altura),
          bodega_largo: parseFloat(formData.bodega_largo),
          bodega_profundidad: parseFloat(formData.bodega_profundidad),
          bodega_limite: parseInt(formData.bodega_limite)
        }
      };
      await createBodega(bodegaData);
      toast.success("Bodega criada com sucesso!");
      navigate("/dashboard/bodegas/listar");
    } catch (error) {
      toast.error("Erro ao criar bodega");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nueva Posición</h1>
          <p className="text-muted-foreground">Crear una nueva Posición en el sistema</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bodega_source">Source</Label>
                <select
                  id="bodega_source"
                  name="bodega_source"
                  value={formData.bodega_source}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  {sources.map((source) => (
                    <option key={source.source_code} value={source.source_code}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodega_nombre">Nombre</Label>
                <Input
                  id="bodega_nombre"
                  name="bodega_nombre"
                  value={formData.bodega_nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bodega_descripcion">Descripción</Label>
                <textarea
                  id="bodega_descripcion"
                  name="bodega_descripcion"
                  value={formData.bodega_descripcion}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="bodega_altura">Altura (m)</Label>
                <Input
                  id="bodega_altura"
                  name="bodega_altura"
                  type="number"
                  step="0.1"
                  value={formData.bodega_altura}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodega_largo">Largo (m)</Label>
                <Input
                  id="bodega_largo"
                  name="bodega_largo"
                  type="number"
                  step="0.1"
                  value={formData.bodega_largo}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodega_profundidad">Profundidad (m)</Label>
                <Input
                  id="bodega_profundidad"
                  name="bodega_profundidad"
                  type="number"
                  step="0.1"
                  value={formData.bodega_profundidad}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodega_limite">Límite</Label>
                <Input
                  id="bodega_limite"
                  name="bodega_limite"
                  type="number"
                  value={formData.bodega_limite}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/bodegas/listar")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriarBodega; 