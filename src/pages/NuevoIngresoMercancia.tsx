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
import { toast } from "sonner";

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
  const { loading, getSources, createIngresoMercancia, validateCsv } =
    useIngresoMercanciaApi();
  const [cargaMasiva, setCargaMasiva] = useState<"si" | "no">("no");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvValidationResult, setCsvValidationResult] = useState<
    { message: string; error: boolean }[] | null
  >(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    source_origen: "",
    responsable: "",
    descripcion: "",
    cargaMasiva: "",
    archivo: ""
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const data = await getSources();
    setSources(data);
  };

  const handleValidateCsv = () => {
    if (!csvFile) {
      toast.error("Debe cargar un archivo CSV.");
      return;
    }
    setCsvLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result;
      if (typeof csvText === "string") {
        try {
          // Suponiendo que ya existe un ingreso_mercancia_id (reemplaza 123 por el valor pertinente)
          const payload = {
            csv_file: csvText,
            source: selectedSource,
            creador: 1, // TODO: Pegar o ID do usuário logado
            fecha: new Date().toISOString(),
            nombre_responsable: responsable,
            descripcion: descripcion,
            es_masiva: cargaMasiva,
          };
          const result = await validateCsv(payload);
        if (result.length > 0 && !result[0].error) {
            //const resultSave = await createIngresoMercancia(data);
            if (result) {
               // Muestra mensaje de éxito y espera un momento antes de navegar
               toast.success("Datos validados y guardados correctamente, recuerde que debe en la siguiente pantalla completar el proceso dando click en el botón de guardar");
              setTimeout(() => {
                navigate(`/dashboard/ingreso-mercancia/${result[0].ingreso_mercancia_id}`);
              }, 1500); // Delay de 1.5 segundos
            }
          } else {
            // Se hay errores, mostrar los resultados de validación
            setCsvValidationResult(result);
          }
        } catch (error) {
          console.error("Error validando CSV:", error);
        } finally {
          setCsvLoading(false);
        }
      }
    };
    reader.readAsText(csvFile);
  };

  const handleSubmit = async () => {
    if (!selectedSource || !responsable || !descripcion  || !cargaMasiva) {
      toast.error("Por favor ingrese los campoas  que son obligatorios.");
      return;
    }
    if (cargaMasiva === "si" && !csvFile) {
      toast.error("Debe cargar un archivo CSV.");
      return;
    }

    const data = {
      source: selectedSource,
      creador: 1, // TODO: Pegar o ID do usuário logado
      fecha: new Date().toISOString(),
      nombre_responsable: responsable,
      descripcion: descripcion,
      es_masiva: cargaMasiva,
    };

    const result = await createIngresoMercancia(data);
    if (result) {
      toast.success("Datos guardados correctamente");
      navigate(`/dashboard/ingreso-mercancia/${result.ingresomercancia_id}`);
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
        <h1 className="text-2xl font-bold">Nuevo proceso de ingreso</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-100"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
          <Button
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
            onClick={handleSubmit}
          >
            Guardar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
            <Label htmlFor="source" className="text-sm font-medium">
              Origen<span className="text-red-500">*</span>
            </Label>
            <Select 
              value={selectedSource} 
              onValueChange={(value) => {
                setSelectedSource(value);
                setFormErrors(prev => ({ ...prev, source_origen: value ? "" : "El origen es obligatorio" }));
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el origen" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.source_code} value={source.source_code}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.source_origen && (
              <p className="text-red-500 text-sm mt-1">{formErrors.source_origen}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha" className="text-sm font-medium">
              Fecha<span className="text-red-500">*</span>
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
              Usuario responsable<span className="text-red-500">*</span>
            </Label>
            <Input
              id="responsable"
              value={responsable}
              onChange={(e) => {
                setResponsable(e.target.value);
                setFormErrors(prev => ({ ...prev, responsable: e.target.value ? "" : "El usuario responsable es obligatorio" }));
              }}
              placeholder="Digite el nombre del responsable"
            />
            {formErrors.responsable && (
              <p className="text-red-500 text-sm mt-1">{formErrors.responsable}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-sm font-medium">
              Descripción<span className="text-red-500">*</span>
            </Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                setFormErrors(prev => ({ ...prev, descripcion: e.target.value ? "" : "La descripción es obligatoria" }));
              }}
              placeholder="Digite una descripción"
            />
            {formErrors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{formErrors.descripcion}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargaMasiva" className="text-sm font-medium">
              Carga Masiva
            </Label>
            <Select 
              value={cargaMasiva} 
              onValueChange={(value) => {
                setCargaMasiva(value);
                setFormErrors(prev => ({ ...prev, cargaMasiva: "" }));
                if (value === "no") {
                  setFormErrors(prev => ({ ...prev, archivo: "" }));
                }
              }}>
              <SelectTrigger id="cargaMasiva">
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="si">Sí</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.cargaMasiva && (
              <p className="text-red-500 text-sm mt-1">{formErrors.cargaMasiva}</p>
            )}
          </div>
          {cargaMasiva === "si" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="csvFile" className="text-sm font-medium">
                  Archivo CSV<span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                 <Input
                   type="file"
                   id="csvFile"
                   accept=".csv"
                   onChange={(e) => {
                     setCsvFile(e.target.files?.[0] || null);
                     setFormErrors(prev => ({
                       ...prev,
                       archivo: e.target.files && e.target.files[0]
                         ? ""
                         : "El archivo CSV es obligatorio"
                     }));
                   }}
                   required
                 />
                 <Button 
                   variant="outline"
                   onClick={() => window.open('/downloads/ingresoMercancia/ingreso_prueba.csv', '_blank')}
                 >
                   Descargar Plantilla CSV
                 </Button>
               </div>
                {formErrors.archivo && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.archivo}</p>
                )}
              </div>
              <div>
                <Button
                  variant="secondary"
                  onClick={handleValidateCsv}
                  disabled={!csvFile || csvLoading}
                  className="mt-2"
                >
                  {csvLoading ? "Validando..." : "Validar y Guardar"}
                </Button>
              </div>
            </>
          )}
          {csvValidationResult &&
            csvValidationResult.length > 0 &&
            csvValidationResult[0].error && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">Errores de Validación</h3>
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2">SKU</th>
                      <th className="border p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvValidationResult[0].message.split(",").map((errorMsg, index) => {
                      // Se espera que cada error tenga el formato: "SKU SKU001: Error mensaje"
                      const [skuPart, ...rest] = errorMsg.split(":");
                      const sku = skuPart.trim();
                      const errorDetail = rest.join(":").trim();
                      return (
                        <tr key={index}>
                          <td className="border p-2">{sku}</td>
                          <td className="border p-2">{errorDetail}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          {csvValidationResult &&
            csvValidationResult.length > 0 &&
            !csvValidationResult[0].error && (
              <div className="mt-4 text-green-600 font-bold">
                Datos validados correctamente
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NuevoIngresoMercancia;