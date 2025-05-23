import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalidaMercanciaApi } from "@/hooks/useSalidaMercanciaApi";
import { toast } from "sonner";

interface Source {
  source_code: string;
  name: string;
}

const NuevoSalidaMercancia = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [responsable, setResponsable] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const { loading, getSources, createSalidaMercancia, validateSalidaCSV } = useSalidaMercanciaApi();
  // Nuevo estado para carga masiva
  const [cargaMasiva, setCargaMasiva] = useState<"si" | "no">("no");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvValidationResult, setCsvValidationResult] = useState<{ message: string; error: boolean }[] | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);  const [formErrors, setFormErrors] = useState({
    selectedSource: "",
    responsable: "",
    descripcion: "",
    csvFile: ""
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const data = await getSources();
    setSources(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !responsable || !descripcion || !cargaMasiva) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }
    // Si es carga masiva, se debe validar el CSV mediante el botón "Validar y Guardar"
    if (cargaMasiva === "si" && !csvFile) {
      toast.error("Debe cargar un archivo CSV");
      return;
    }

    try {
      const payload = {
        salidaMercancia: {
          source: selectedSource,
          creador: 1,
          fecha: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          nombre_responsable: responsable,
          descripcion: descripcion,
        },
      };

      const response = await createSalidaMercancia(payload);
      toast.success("Salida de mercancía creada exitosamente");
      navigate(`/dashboard/salida-mercancia/${response.salidamercancia_id}`);
    } catch (error) {
      // Error handling en el hook
    }
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
          const payload = {
            csv_file: csvText,
            source: selectedSource,
            nombre_responsable: responsable,
            fecha: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            descripcion: descripcion,
            estado: "n",
            creador: "1",
            es_masiva: cargaMasiva,
          };
          const result = await validateSalidaCSV(payload);
          
          if (result.length > 0 && !result[0].error) {
            //const resultSave = await createIngresoMercancia(data);
            if (result) {
               // Muestra mensaje de éxito y espera un momento antes de navegar
              toast.success("Datos validados y guardados correctamente, recuerde que debe en la siguiente pantalla completar el proceso dando click en el botón de guardar");
              setTimeout(() => {
                navigate(`/dashboard/salida-mercancia/${result[0].salida_mercancia_id}`);
              }, 1500); // Delay de 1.5 segundos
            }        
          } 
          else {
            // Si hay errores, mostrar los resultados de validación en una tabla
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
        <h1 className="text-2xl font-bold">Nuevo Proceso de Salida</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-100"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
          {cargaMasiva === "si" ? (
            <Button
              className="bg-ecommerce-500 hover:bg-ecommerce-600"
              onClick={handleValidateCsv}
            >
              {csvLoading ? "Validando y Guardando..." : "Guardar"}
            </Button>
          ) : (
            <Button
              className="bg-ecommerce-500 hover:bg-ecommerce-600"
              onClick={handleSubmit}
            >
              Guardar
            </Button>
          )}
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
                setFormErrors(prev => ({
                  ...prev,
                  selectedSource: value ? "" : "Debe seleccionar un origen"
                }));
              }}
            >
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
            {formErrors.selectedSource && (
              <p className="text-red-500 text-sm">{formErrors.selectedSource}</p>
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
              Usuario Responsable<span className="text-red-500">*</span>
            </Label>
            <Input
              id="responsable"
              value={responsable}
              onChange={(e) => {
                setResponsable(e.target.value);
                setFormErrors(prev => ({
                  ...prev,
                  responsable: e.target.value ? "" : "El usuario responsable es obligatorio"
                }));
              }}
              placeholder="Ingrese el nombre del responsable"
            />
            {formErrors.responsable && (
              <p className="text-red-500 text-sm">{formErrors.responsable}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-sm font-medium">
              Descripción<span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                setFormErrors(prev => ({
                  ...prev,
                  descripcion: e.target.value ? "" : "La descripción es obligatoria"
                }));
              }}
              placeholder="Ingrese la descripción"
              rows={4}
            />
            {formErrors.descripcion && (
              <p className="text-red-500 text-sm">{formErrors.descripcion}</p>
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
                // Clear CSV file error when switching to "no"
                if(value === "no"){
                  setFormErrors(prev => ({ ...prev, csvFile: "" }));
                }
              }}
            >
              <SelectTrigger id="cargaMasiva">
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="si">Sí</SelectItem>
              </SelectContent>
            </Select>
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
                       onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                       required
                     />
                     <Button 
                       variant="outline"
                       onClick={() => window.open('/downloads/salidaMercancia/salida_prueba.csv', '_blank')}
                     >
                       Descargar Plantilla CSV
                     </Button>
                   </div>
              </div>
              <div>
                <Button
                  variant="secondary"
                  onClick={handleValidateCsv}
                  disabled={!csvFile || csvLoading}
                >
                  {csvLoading ? "Validando y Guardando..." : "Validar y Guardar"}
                </Button>
              </div>
              {csvValidationResult && csvValidationResult.length > 0 && csvValidationResult[0].error ? (
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
              ) : csvValidationResult && csvValidationResult.length > 0 && !csvValidationResult[0].error ? (
                <div className="mt-4 text-green-600 font-bold">
                  Datos validados correctamente.
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NuevoSalidaMercancia;