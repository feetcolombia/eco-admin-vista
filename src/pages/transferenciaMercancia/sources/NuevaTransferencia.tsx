import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventorySourcesApi, InventorySource,transferSourcesApi } from '@/api/transferSourcesApi';
import { toast } from "sonner";

const NuevaTransferencia = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState<InventorySource[]>([]);
  const [form, setForm] = useState({
      source_origen: '',
      source_destino: '',
      fecha: '',
      descripcion: '',
      cargaMasiva: 'no',
      archivo: null,
    });
  const today = new Date().toISOString().split('T')[0];
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    (async () => {
      const all = await inventorySourcesApi.getAll();
      setSources(all);
    })();
  }, []);

   // valida un campo
 const validateField = (name: string, value: string, f: typeof form) => {
   let error = '';
   switch (name) {
     case 'source_origen':
       if (!value) error = 'Origen es obligatorio.';
       else if (value === f.source_destino) error = 'Origen y destino no pueden ser iguales.';
       break;
     case 'source_destino':
       if (!value) error = 'Destino es obligatorio.';
       else if (value === f.source_origen) error = 'Origen y destino no pueden ser iguales.';
       break;
     case 'fecha':
       if (!value) error = 'Fecha es obligatoria.';
       break;
     case 'descripcion':
       if (!value) error = 'Descripción es obligatoria.';
       break;
   }
   return error;
 };
 const [loading, setLoading] = useState(false);
 const [csvValidationErrors, setCsvValidationErrors] = useState<{ sku: string; error: string }[] | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => {
             const newForm = { ...f, [name]: value };
             // validar solo el campo modificado
             const fieldError = validateField(name, value, newForm);
             setErrors(prev => ({ ...prev, [name]: fieldError }));
             // si cambió uno de los dos selects, re-valida el otro para la regla de no iguales
             if (name === 'source_origen') {
               setErrors(prev => ({
                 ...prev,
                 source_destino: validateField('source_destino', newForm.source_destino, newForm)
               }));
             }
             if (name === 'source_destino') {
               setErrors(prev => ({
                 ...prev,
                 source_origen: validateField('source_origen', newForm.source_origen, newForm)
               }));
             }
             return newForm;
           });
          };
    const isValid =
      form.source_origen &&
      form.source_destino &&
      form.fecha &&
      form.descripcion &&
      form.cargaMasiva &&
      (form.cargaMasiva === 'si' ? form.archivo : true) &&
      Object.values(errors).every(msg => !msg);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
        !form.source_origen ||
        !form.source_destino ||
        !form.fecha ||
        !form.descripcion ||
        !form.cargaMasiva
      ) {
        toast.error("Completar todos los campos obligatorios.");
        return;
      }
    
      // Si carga masiva es "si", validar que se haya subido un archivo .csv
      if (form.cargaMasiva === "si") {
        if (!form.archivo) {
          toast.error("Debe cargar un archivo CSV para carga masiva.");
          return;
        }
        if (form.archivo.type !== "text/csv") {
          toast.error("El archivo debe ser un CSV válido.");
          return;
        }
      }
   navigate(-1);
   try {
     const payload = {
             source_origen: form.source_origen,
             source_destino: form.source_destino,
             descripcion: form.descripcion,
             creador: 1,
             tipo: 'n',
             fecha: form.fecha,
             nombre_responsable: form.descripcion,
             estado: 'n' as "n"
     };
     const result = await transferSourcesApi.createMercancia(payload);
     // tras crear, ir a ejecutar la transferencia
     navigate(`/transferenciaMercancia/sources/execute-transferencia-source/${result.transferencia_source_id}`);
   } catch (error) {
     console.error(error);
     toast.error('Error al guardar ingreso de mercancía');
   }
  };

  const handleValidarGuardar = async () => {
    if (!form.archivo) {
      toast("Archivo CSV es obligatorio.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result;
      if (typeof csvText === "string") {
        const payload = {
          csv_file: csvText,
          source_origen: form.source_origen,
          source_destino: form.source_destino,
          nombre_responsable: "admin",
          descripcion: form.descripcion,
          estado: "c",
          tipo: "ic",
          creador: "1",
          es_masiva: form.cargaMasiva === "si" ? "s" : "n"
        };
        try {
          const result = await transferSourcesApi.importCsv(payload);
          console.log("Resultado de importación CSV:", result);          if (result.length > 0 && !result[0].error) {
            toast.success(result[0].message);
            setCsvValidationErrors(null);
            navigate(`/transferenciaMercancia/sources/execute-transferencia-source/${result[0].transferencia_source_id}`);
          } else if(result.length > 0 && result[0].error) {
            // Parse the error message to extract SKU and error details
            const errors = result[0].message.split(',').map(msg => {
              const [skuPart, ...errorPart] = msg.split(':');
              return { sku: skuPart.trim(), error: errorPart.join(':').trim() };
            });
            setCsvValidationErrors(errors);
          }
        } catch (error) {
          console.error("Error al importar CSV:", error);
          toast.error("Error al importar CSV, intente nuevamente.");
        } finally {
          setLoading(false);
        }
      }
    };
    reader.readAsText(form.archivo);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Nueva Transferencia</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
      <div>
    <label className="block mb-1">Origen<span className="text-red-500">*</span></label>
    <select
      name="source_origen"
      value={form.source_origen}
      onChange={handleChange}
      className="w-full border rounded p-2"
      required
    >
      <option value="">Seleccione origen</option>
      {sources.map(s => (
        <option key={s.source_code} value={s.source_code}>
          {s.name}
        </option>
      ))}
    </select>
    {errors.source_origen && <p className="text-red-500 text-sm mt-1">{errors.source_origen}</p>}
  </div>
  <div>
    <label className="block mb-1">Destino<span className="text-red-500">*</span></label>
    <select
      name="source_destino"
      value={form.source_destino}
      onChange={handleChange}
      className="w-full border rounded p-2"
      required
    >
      <option value="">Seleccione destino</option>
      {sources.map(s => (
        <option
          key={s.source_code}
          value={s.source_code}
          disabled={s.source_code === form.source_origen}  // ← no permitir repetir
        >
          {s.name}
        </option>
      ))}
    </select>
    {errors.source_destino && <p className="text-red-500 text-sm mt-1">{errors.source_destino}</p>}
    </div>
        <div>
          <label className="block mb-1">Fecha<span className="text-red-500">*</span></label>
          <Input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
            max={today}
          />
          {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
        </div>
        <div>
          <label className="block mb-1">Descripción<span className="text-red-500">*</span></label>
          <Input
            type="text"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción..."
            required
            className="w-full border rounded p-2 h-24 resize-none"
          />
        </div>
        {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
        <div>
          <label className="block mb-1">Carga Masiva<span className="text-red-500">*</span></label>
          <select
            name="cargaMasiva"
            value={form.cargaMasiva}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </div>
        {form.cargaMasiva === 'si' && (
          <>
            <div className="space-y-2">
              <label className="block mb-1">
                Archivo CSV<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  name="archivo"
                  onChange={(e) =>
                    setForm(prev => ({ ...prev, archivo: e.target.files ? e.target.files[0] : null }))
                  }
                  required
                />
                <Button
                  variant="outline"
                  onClick={() => window.open('/downloads/transferenciaSource/ingreso_source_prueba.csv', '_blank')}
                >
                  Descargar Plantilla CSV
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <Button type="button" onClick={handleValidarGuardar} disabled={loading}>
                {loading ? "Validando y Guardando..." : "Validar y Guardar"}
              </Button>
            </div>
            {csvValidationErrors && csvValidationErrors.length > 0 && (
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
                    {csvValidationErrors.map((errorItem, index) => (
                      <tr key={index}>
                        <td className="border p-2">{errorItem.sku}</td>
                        <td className="border p-2">{errorItem.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              Guardar
            </Button>
        </div>
      </form>
    </div>
  );
};

export default NuevaTransferencia;