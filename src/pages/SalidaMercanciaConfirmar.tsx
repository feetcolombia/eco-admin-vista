import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSalidaMercanciaApi } from "@/hooks/useSalidaMercanciaApi";
import { toast } from "sonner";

interface ProductoAgrupado {
  bodega_nombre: string;
  cantidad: number;
}

interface Producto {
  sku: string;
  bodega_nombre: string;
  cantidad: string;
}

const SalidaMercanciaConfirmar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [totalEscaneados, setTotalEscaneados] = useState(0);
  const [productosPorPosicion, setProductosPorPosicion] = useState<ProductoAgrupado[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const { loading, getSalidaById, completarSalida } = useSalidaMercanciaApi();

  useEffect(() => {
    if (id) {
      fetchSalida();
    }
  }, [id]);

  const fetchSalida = async () => {
    if (!id || isNaN(Number(id))) return;
    const data = await getSalidaById(Number(id));
    if (data && data.productos) {
      // Guardar produtos para a tabela
      setProductos(data.productos);
      
      // Agrupar produtos por posição
      const agrupados = data.productos.reduce((acc: ProductoAgrupado[], curr) => {
        const posicion = acc.find(p => p.bodega_nombre === curr.bodega_nombre);
        if (posicion) {
          posicion.cantidad += parseInt(curr.cantidad);
        } else {
          acc.push({
            bodega_nombre: curr.bodega_nombre,
            cantidad: parseInt(curr.cantidad)
          });
        }
        return acc;
      }, []);

      setProductosPorPosicion(agrupados);
      setTotalEscaneados(data.productos.reduce((total, curr) => total + parseInt(curr.cantidad), 0));
    }
  };

  const handleConfirmar = async () => {
    if (!id) return;
    
    try {
      await completarSalida({
        salidaMercanciaId: parseInt(id),
        sourceCode: "default"
      });
      
      toast.success("Salida de mercancía confirmada con éxito");
      navigate("/dashboard/salida-mercancia");
    } catch (error) {
      // O toast de erro já é mostrado no hook
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Verificar - Confirmar proceso de salida de mercancía</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-100"
            onClick={() => navigate(`/dashboard/salida-mercancia/${id}`)}
          >
            Regresar
          </Button>
          <Button
            variant="outline"
            className="bg-gray-100"
            onClick={() => {
              // Implementar exportação para Excel
            }}
          >
            Exportar a Excel
          </Button>
          <Button
            className="bg-ecommerce-500 hover:bg-ecommerce-600"
            onClick={handleConfirmar}
            disabled={loading}
          >
            Confirmar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Total de Elementos Escaneados</h2>
          <p className="text-4xl font-bold">{totalEscaneados}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Total por Posición</h2>
          <div className="space-y-2">
            {productosPorPosicion.map((posicion, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{posicion.bodega_nombre}:</span>
                <span className="font-semibold">{posicion.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posición
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad a sacar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productos.map((producto, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.bodega_nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.cantidad}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalidaMercanciaConfirmar; 