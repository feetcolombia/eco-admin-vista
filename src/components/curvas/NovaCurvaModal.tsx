import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurvasApi } from "@/hooks/useCurvasApi";

interface NovaCurvaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  curvaId?: string | null;
}

interface Talla {
  curva_producto_talla_id: string;
  curva_producto_id: string;
  talla: string;
}

export const NovaCurvaModal: React.FC<NovaCurvaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  curvaId,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [novaTalla, setNovaTalla] = useState("");
  const { toast } = useToast();
  const { createCurva, updateCurva, getCurva } = useCurvasApi();

  useEffect(() => {
    if (curvaId && isOpen) {
      fetchCurva();
    } else {
      resetForm();
    }
  }, [curvaId, isOpen]);

  const fetchCurva = async () => {
    if (!curvaId) return;
    const data = await getCurva(curvaId);
    if (data) {
      setNombre(data.nombre);
      setDescripcion(data.descripcion);
      setTallas(data.tallas);
    }
  };

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setTallas([]);
    setNovaTalla("");
  };

  const handleAddTalla = () => {
    if (novaTalla.trim()) {
      setTallas([...tallas, { curva_producto_talla_id: "", curva_producto_id: "", talla: novaTalla }]);
      setNovaTalla("");
    }
  };

  const handleRemoveTalla = (index: number) => {
    setTallas(tallas.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (curvaId) {
      const data = {
        data: {
          curva_producto_id: parseInt(curvaId),
          nombre,
          descripcion,
          tallas: tallas.map(t => ({ talla: parseInt(t.talla) }))
        }
      };
      await updateCurva(data);
    } else {
      const data = {
        data: {
          nombre,
          descripcion,
          tallas: tallas.map(t => ({ talla: parseInt(t.talla) }))
        }
      };
      await createCurva(data);
    }
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {curvaId ? "Editar Curva" : "Nueva Curva"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese el nombre de la curva"
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese la descripción de la curva"
            />
          </div>

          <div>
            <Label>Tallas</Label>
            <div className="flex gap-2">
              <Input
                value={novaTalla}
                onChange={(e) => setNovaTalla(e.target.value)}
                placeholder="Agregar talla"
              />
              <Button onClick={handleAddTalla} type="button">
                Agregar
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {tallas.map((talla, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={talla.talla} disabled />
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveTalla(index)}
                    type="button"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {curvaId ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 