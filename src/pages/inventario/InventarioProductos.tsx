import React, { useEffect, useState } from 'react';
import { FileX, File as FileIcon, FileText } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import inventarioProductosApi, { UrlImagen } from '../../components/inventario/inventarioProductosApi';
import { useIngresoMercanciaApi } from '../../hooks/useIngresoMercanciaApi';

interface ProductData {
  sizes: { [key: string]: string };
  salable_quantity: string;
  image_url: string;
  price: string;
  special_price: string | null;
  brand: string;
}

interface ProductItem {
  sku: string;
  data: ProductData;
}

interface Source {
  source_code: string;
  name: string;
}

const typeOptions = [
  { label: 'Todos', value: '' },
  { label: 'Femenino', value: 'F' },
  { label: 'Masculino', value: 'M' },
  { label: 'Infantil', value: 'I' },
];

const brandOptions = [
  { label: 'Todos', value: '' },
  { label: 'Actvitta', value: '125' },
  { label: 'Beira Rio', value: '126' },
  { label: 'Modare', value: '127' },
  { label: 'Moleca', value: '128' },
  { label: 'Molekinha', value: '129' },
  { label: 'Molekinho', value: '130' },
  { label: 'Vizzano', value: '131' },
  { label: 'Br Sport', value: '132' },
  { label: 'Allegro', value: '133' },
];

const formatPrice = (price: string) => {
  const num = Number(price);
  return `$ ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MyPdfDocument = ({ prodData, allowedSizes }: { prodData: ProductItem[], allowedSizes: string[] }) => {
  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 10 },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 10 
    },
    title: { fontSize: 18, textAlign: 'center' },
    logo: { width: 50, height: 50 },
    table: { 
      display: 'table', 
      width: 'auto', 
      borderStyle: 'solid', 
      borderWidth: 1, 
      borderRightWidth: 0, 
      borderBottomWidth: 0 
    },
    tableRow: { flexDirection: 'row' },
    tableCol: { 
      borderStyle: 'solid', 
      borderWidth: 1, 
      borderLeftWidth: 0, 
      borderTopWidth: 0, 
      padding: 4 
    },
    tableCell: {}
  });    
  
  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventário Feet Colombia</Text>
          <Image style={styles.logo} src="/favicon.jpg" />
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: '40%' }]}><Text>SKU</Text></View>
            <View style={[styles.tableCol, { width: '15.5%' }]}><Text>Cantidad</Text></View>
            <View style={[styles.tableCol, { width: '17.5%' }]}><Text>Precio</Text></View>
            <View style={[styles.tableCol, { width: '17.5%' }]}><Text>Precio Especial</Text></View>
            <View style={[styles.tableCol, { width: '17.5%' }]}><Text>Tallas</Text></View>
          </View>
          {prodData.map(({ sku, data }) => {
            const cantidad = parseInt(data.salable_quantity, 10);
            const precio = formatPrice(data.price);
            const precioEspecial = data.special_price ? formatPrice(data.special_price) : '-';
            const tallas = Object.entries(data.sizes || {})
              .filter(([size]) => allowedSizes.includes(size))
              .map(([size, qty]) => `${size}: ${qty}`)
              .join(', ');
            return (
              <View style={styles.tableRow} key={sku}>
                <View style={[styles.tableCol, { width: '40%' }]}><Text>{sku}</Text></View>
                <View style={[styles.tableCol, { width: '15.5%' }]}><Text>{cantidad}</Text></View>
                <View style={[styles.tableCol, { width: '17.5%' }]}><Text>{precio}</Text></View>
                <View style={[styles.tableCol, { width: '17.5%' }]}><Text>{precioEspecial}</Text></View>
                <View style={[styles.tableCol, { width: '17.5%' }]}><Text>{tallas}</Text></View>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

const InventarioProductos = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('default'); // Valor por defecto "default"
  const [selectedType, setSelectedType] = useState<string>(''); // "Todos"
  const [selectedBrand, setSelectedBrand] = useState<string>(''); // "Todos"
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [sourceName, setSourceName] = useState<string>(''); // Para mostrar el nombre del default source
  const [sources, setSources] = useState<Source[]>([]);
  const perPage = 10;
  const allowedSizes = [
    '18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33',
    '34','35','36','37','38','39','40','41','42','43','44'
  ];

  const { getSources } = useIngresoMercanciaApi();
  
  useEffect(() => {
    const loadSources = async () => {
      try {
        const sourcesList: Source[] = await getSources();
        setSources(sourcesList);
        // Asignar fuente default si existe
        const defaultSrc = sourcesList.find(src => src.source_code === 'default');
        if (defaultSrc) {
          setSelectedSource(defaultSrc.source_code);
          setSourceName(defaultSrc.name);
        }
      } catch (err) {
        console.error('Error al cargar las fuentes:', err);
      }
    };
  
    loadSources();
  }, []); // Ejecuta el efecto una sola vez

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Se envía también el selectedSource
        const result = await inventarioProductosApi.getCustomProducts(selectedType, selectedBrand, selectedSource);
        // Se evita el error convirtiendo null/undefined a objeto vacío
        const resObj = result ? (Array.isArray(result) && result.length > 0 ? result[0] : result) : {};
        const productsArray: ProductItem[] = Object.keys(resObj).map(sku => ({
          sku,
          data: resObj[sku]
        }));
        setProducts(productsArray);
        setPage(1);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };
  
    fetchProducts();
  }, [selectedType, selectedBrand, selectedSource]);
  
  const filteredProducts = products.filter(product =>
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedProducts = filteredProducts.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredProducts.length / perPage);

  const exportToCSV = () => {
    if(filteredProducts.length === 0) return;
    const header = ['SKU', 'Cantidad', 'Precio', 'Precio Especial', 'Tallas'];
    const rows = filteredProducts.map(({ sku, data }) => {
      const cantidad = parseInt(data.salable_quantity, 10);
      const precio = formatPrice(data.price);
      const precioEspecial = data.special_price ? formatPrice(data.special_price) : '-';
      const tallas = Object.entries(data.sizes || {})
        .filter(([size]) => allowedSizes.includes(size))
        .map(([size, qty]) => `${size}: ${qty}`)
        .join(' - ');
      return [sku, cantidad, precio, precioEspecial, tallas];
    });
    const csvContent = [header, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventario_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (filteredProducts.length === 0) return;
    import("xlsx").then((XLSX) => {
      const dataToExport = filteredProducts.map(({ sku, data }) => {
        const cantidad = parseInt(data.salable_quantity, 10);
        const precio = formatPrice(data.price);
        const precioEspecial = data.special_price ? formatPrice(data.special_price) : '-';
        const tallas = Object.entries(data.sizes || {})
          .filter(([size]) => allowedSizes.includes(size))
          .map(([size, qty]) => `${size}: ${qty}`)
          .join(', ');
        return { SKU: sku, Cantidad: cantidad, Precio: precio, "Precio Especial": precioEspecial, Tallas: tallas };
      });
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const keys = Object.keys(dataToExport[0]);
      const cols = keys.map(key => {
        const maxLength = Math.max(...dataToExport.map(row => (row[key] ? row[key].toString().length : 0)));
        return { wch: maxLength + 2 };
      });
      worksheet['!cols'] = cols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
      XLSX.writeFile(workbook, "inventario_productos.xlsx");
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">
        Inventario de Productos {`${sourceName}`}
      </h1>
      {/* Filtros y Buscador */}
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex gap-4">
          {/* Nuevo select Source */}
          <div>
            <label className="mr-2">Source:</label>
            <select
              value={selectedSource}
              onChange={(e) => {
                const newSource = e.target.value;
                setSelectedSource(newSource);
                const foundSource = sources.find(src => src.source_code === newSource);
                setSourceName(foundSource ? foundSource.name : '');
              }}
              className="border rounded p-1"
            >
              {sources.map(src => (
                <option key={src.source_code} value={src.source_code}>
                  {src.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2">Tipo:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border rounded p-1"
            >
              <option value="">Todos</option>
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2">Marca:</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="border rounded p-1"
            >
              <option value="">Todos</option>
              {brandOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mr-2">Buscar por SKU:</label>
          <input
            type="text"
            placeholder="SKU..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="border rounded p-1"
          />
        </div>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {/* Botones de Exportación */}
      {filteredProducts.length > 0 && (
        <div className="mb-4 flex justify-end gap-4">
          <button onClick={exportToExcel} className="px-3 py-1 border rounded flex items-center">
            <FileX className="mr-2" size={16} />
            Exportar a Excel
          </button>
          <button onClick={exportToCSV} className="px-3 py-1 border rounded flex items-center">
            <FileIcon className="mr-2" size={16} />
            Exportar a CSV
          </button>
          <PDFDownloadLink
            document={<MyPdfDocument prodData={filteredProducts} allowedSizes={allowedSizes} />}
            fileName="inventario_productos.pdf"
            className="flex"
          >
            <button className="px-3 py-1 border rounded flex items-center">
              <FileText className="mr-2" size={16} />
              Exportar a PDF
            </button>
          </PDFDownloadLink>
        </div>
      )}
      {/* Tabla */}
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Imagen</th>
            <th className="border p-2">SKU</th>
            <th className="border p-2">Cantidad</th>
            <th className="border p-2">Precio</th>
            <th className="border p-2">Precio Especial</th>
            <th className="border p-2">Tallas</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="border p-2 text-center" colSpan={6}>
                Cargando productos...
              </td>
            </tr>
          ) : filteredProducts.length === 0 ? (
            <tr>
              <td className="border p-2 text-center" colSpan={6}>
                No hay registros
              </td>
            </tr>
          ) : (
            paginatedProducts.map(({ sku, data }) => {
              // Se usa data.sizes || {} para evitar que Object.entries falle
              const tallas = Object.entries(data.sizes || {})
                .filter(([size]) => allowedSizes.includes(size))
                .map(([size, qty]) => `${size}: ${qty}`)
                .join(', ');
              return (
                <tr key={sku}>
                  <td className="border p-2">
                    <img src={`${UrlImagen}${data.image_url}`} alt={sku} className="h-12 w-12 object-contain" />
                  </td>
                  <td className="border p-2">{sku}</td>
                  <td className="border p-2">{parseInt(data.salable_quantity, 10)}</td>
                  <td className="border p-2">{formatPrice(data.price)}</td>
                  <td className="border p-2">
                    {data.special_price ? formatPrice(data.special_price) : '-'}
                  </td>
                  <td className="border p-2">{tallas}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {totalPages > 1 && !loading && (
        <div className="mt-4 flex items-center gap-4">
          <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default InventarioProductos;