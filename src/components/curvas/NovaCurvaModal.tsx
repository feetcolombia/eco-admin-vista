import React, { useState } from "react";
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

interface NovaCurvaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Talla {
  talla: number;
}

export const NovaCurvaModal = ({ isOpen, onClose, onSuccess }: NovaCurvaModalProps) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [tallas, setTallas] = useState<Talla[]>([]);
  const { toast } = useToast();

  const handleAddTalla = () => {
    const valor = parseInt(novoValor);
    if (!isNaN(valor)) {
      setTallas([...tallas, { talla: valor }]);
      setNovoValor("");
    }
  };

  const handleRemoveTalla = (index: number) => {
    setTallas(tallas.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || !descripcion.trim() || tallas.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos e adicione pelo menos um valor de talla.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("https://stg.feetcolombia.com/rest/V1/feetproductos-curva/curva", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            nombre,
            descripcion,
            tallas,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Curva criada com sucesso!",
        });
        onSuccess();
        onClose();
        // Limpar o formulário
        setNombre("");
        setDescripcion("");
        setTallas([]);
      } else {
        throw new Error("Erro ao criar curva");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar a curva. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Tipo de Curva</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Digite o nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Digite a descrição"
            />
          </div>
          <div className="space-y-2">
            <Label>Agregar Valor Talla</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder="Digite o valor"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTalla();
                  }
                }}
              />
              <Button onClick={handleAddTalla}>Agregar</Button>
            </div>
          </div>
          {tallas.length > 0 && (
            <div className="space-y-2">
              <Label>Valores Talla</Label>
              <div className="border rounded-md p-2">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">#</th>
                      <th className="text-left">Valor Talla</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tallas.map((talla, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2">{index + 1}</td>
                        <td className="py-2">{talla.talla}</td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTalla(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 