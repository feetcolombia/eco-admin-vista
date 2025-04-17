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
  isViewMode?: boolean;
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
  isViewMode = false,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [novaTalla, setNovaTalla] = useState("");
  const [errors, setErrors] = useState<{ nombre?: string; tallas?: string }>({});
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

  const validateForm = () => {
    const newErrors: { nombre?: string; tallas?: string } = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }
    
    if (tallas.length === 0) {
      newErrors.tallas = "Debe agregar al menos una talla";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la curva",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isViewMode ? "Ver Curva" : (curvaId ? "Editar Curva" : "Nueva Curva")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) {
                  setErrors({ ...errors, nombre: undefined });
                }
              }}
              placeholder="Ingrese el nombre de la curva"
              className={errors.nombre ? "border-red-500" : ""}
              disabled={isViewMode}
            />
            {errors.nombre && (
              <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>
            )}
          </div>

          <div>
            <Label>Descripción</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese la descripción de la curva"
              disabled={isViewMode}
            />
          </div>

          <div>
            <Label>Tallas</Label>
            <div className="flex gap-2">
              <Input
                value={novaTalla}
                onChange={(e) => setNovaTalla(e.target.value)}
                disabled={isViewMode}
                placeholder="Agregar talla"
              />
              {!isViewMode && (
                <Button onClick={handleAddTalla} type="button">
                  Agregar
                </Button>
              )}
            </div>
            <div className="mt-2 space-y-2">
              {tallas.map((talla, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={talla.talla} disabled />
                  {!isViewMode && (
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveTalla(index)}
                      type="button"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          {!isViewMode ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Guardar</Button>
            </>
          ) : (
            <Button onClick={onClose}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 