import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurvasApi } from "@/hooks/useCurvasApi";

interface VisualizarCurvaModalProps {
  isOpen: boolean;
  onClose: () => void;
  curvaId: string | null;
  onSuccess: () => void;
}

interface Talla {
  curva_producto_talla_id: string;
  curva_producto_id: string;
  talla: string;
}

export const VisualizarCurvaModal: React.FC<VisualizarCurvaModalProps> = ({
  isOpen,
  onClose,
  curvaId,
  onSuccess,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [novaTalla, setNovaTalla] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { getCurva, updateCurva } = useCurvasApi();

  useEffect(() => {
    if (curvaId && isOpen) {
      fetchCurva();
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
    if (!curvaId) return;
    
    const data = {
      data: {
        curva_producto_id: parseInt(curvaId),
        nombre,
        descripcion,
        tallas: tallas.map(t => ({ talla: parseInt(t.talla) }))
      }
    };

    await updateCurva(data);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Curva" : "Visualizar Curva"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Tamanhos</Label>
            <div className="flex gap-2">
              <Input
                value={novaTalla}
                onChange={(e) => setNovaTalla(e.target.value)}
                disabled={!isEditing}
                placeholder="Adicionar tamanho"
              />
              {isEditing && (
                <Button onClick={handleAddTalla} type="button">
                  Adicionar
                </Button>
              )}
            </div>
            <div className="mt-2 space-y-2">
              {tallas.map((talla, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={talla.talla} disabled />
                  {isEditing && (
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveTalla(index)}
                      type="button"
                    >
                      Remover
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Editar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Salvar</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 