import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventorySourcesApi, InventorySource,transferSourcesApi } from '@/api/transferSourcesApi';


const NuevaTransferencia = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState<InventorySource[]>([]);
  const [form, setForm] = useState({
    source_origen: '',
    source_destino: '',
    fecha: '',
    descripcion: ''
  });

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
   Object.values(form).every(v => v) &&
   Object.values(errors).every(msg => !msg);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      alert('Corrige los errores antes de guardar.');
      return;
    }
   console.log('Crear transferencia:', form);
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
     alert('Error al guardar ingreso de mercancía');
   }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Nueva Transferencia</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
      <div>
    <label className="block mb-1">Origen</label>
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
    <label className="block mb-1">Destino</label>
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
          <label className="block mb-1">Fecha</label>
          <Input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
          />
          {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
        </div>
        <div>
          <label className="block mb-1">Descripción</label>
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