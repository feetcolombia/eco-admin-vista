import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Loader2, X } from 'lucide-react';
import { transferBodegasApi, Source } from '@/api/transferBodegasApi';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface TransferenciaDetalle {
    transferencia_bodega_id: string;
    soruce: string;
    id_bodega_origen: string;
    id_bodega_destino: string;
    cantidad: string;
    descripcion: string;
    responsable: string;
    estado: string;
    codigo: string;
    created_at: string | null;
    updated_at: string | null;
    nombre_bodega_origen: string;
    nombre_bodega_destino: string;
    nombre_responsable: string;
    trasferencia_total: string;
    historico: string | null;
    es_masiva: string;
    productos: any[];
}

interface Producto {
    id: string;
    sku: string;
    quantidade: number;
    quantidadeDisponivel: number;
    observacion: string;
}

interface TransferSection {
    barcode: string;
    error: string;
    produtos: Producto[];
    soundEnabled: boolean;
    totalEscaneado: number;
    posicionOrigen: string;
    posicionDestino: string;
}

// Helper: actualiza el listado de productos basado en el escaneo
const processScanResults = (
    existing: Producto[],
    scanned: any,
    qtyAvailable: number
): Producto[] => {
    const index = existing.findIndex(p => p.id === scanned.id_producto);
    if (index > -1) {
        const current = existing[index];
        if (current.quantidade + 1 > qtyAvailable) {
            throw new Error("La cantidad disponible del producto es menor a la cantidad a escanear");
        }
        return existing.map(p =>
            p.id === scanned.id_producto ? { ...p, quantidade: p.quantidade + 1 } : p
        );
    }
    return [
        ...existing,
        {
            id: scanned.id_producto,
            sku: scanned.product_sku,
            quantidade: 1,
            quantidadeDisponivel: qtyAvailable,
            observacion: '',
        }
    ];
};

// Función para escanear producto y actualizar lista
const handleScan = async (
    barcode: string,
    bodegaOrigen: string,
    bodegaDestino: string,
    soruce: string,
    updateFn: (prev: Producto[]) => Producto[]
) => {
    const data = await transferBodegasApi.scanBarcode(barcode, bodegaOrigen, bodegaDestino, soruce, 1);
    if (!Array.isArray(data) || !data[0]?.success) {
        throw new Error("Producto no encontrado");
    }
    const result = data[0];
    const qtyAvailable = parseInt(result.cantidad_disponible, 10);
    return updateFn(processScanResults([], result, qtyAvailable));
};

const ExecutarTransferencia = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [transferencia, setTransferencia] = useState<any>(null);
    const [barcode, setBarcode] = useState('');
    const [error, setError] = useState('');
    const [produtos, setProdutos] = useState<Producto[]>([]);
    const [sources, setSources] = useState<Source[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [bodegasForSource, setBodegasForSource] = useState<any[]>([]);

    // Estados para la sección principal (cuando trasferencia_total === "1")
    const [posicionOrigenMain, setPosicionOrigenMain] = useState<string>('');
    const [posicionDestinoMain, setPosicionDestinoMain] = useState<string>('');

    // Secciones adicionales
    const [transferSections, setTransferSections] = useState<TransferSection[]>([]);
    const [saving, setSaving] = useState(false);

    // Carga de datos
    const fetchTransferencia = useCallback(async () => {
        try {
            const data = await transferBodegasApi.getTransferencia(id!, token);
            if (data?.length) {
                const t = data[1];
                setTransferencia(t);
        
                // Si no es transferencia_total === "1", se procesan los productos de forma tradicional
                if (t.productos?.length > 0 && t.trasferencia_total !== "1") {
                    const mapped: Producto[] = t.productos.map((p: any) => ({
                        id: p.id_producto,
                        sku: p.sku,
                        quantidade: parseInt(p.cantidad_transferir),
                        quantidadeDisponivel: parseInt(p.cantidad_disponible),
                        observacion: p.observacion || ''
                    }));
                    setProdutos(mapped);
                } else if (t.trasferencia_total === "1") {
                    // Si es transferencia_total === "1", se limpia el array de productos
                    setProdutos([]);
                }
        
                // Cuando trasferencia_total es "1", se separan los productos por secciones
                if (t.trasferencia_total === "1") {
                    const sections: TransferSection[] = [];
                    // Primero, recorrer las secciones adicionales (productos_seccion_1, productos_seccion_2, etc.)
                    Object.entries(t).forEach(([key, value]) => {
                        if (key.startsWith("productos_seccion_")) {
                            const sectionIndex = parseInt(key.replace("productos_seccion_", ""), 10);
                            // Ignorar la sección 0, ya que se usará para la primera posición
                            if (sectionIndex === 0) {
                                return;
                            }
                            const rawProducts: any[] = Array.isArray(value) ? value : [];
                            const sectionProducts: Producto[] = rawProducts.map(p => ({
                                id: p.id_producto,
                                sku: p.sku,
                                quantidade: parseInt(p.cantidad_transferir),
                                quantidadeDisponivel: parseInt(p.cantidad_disponible),
                                observacion: p.observacion || ''
                            }));
                            const posicionOrigen = rawProducts[0]?.id_bodega_origen || "";
                            const posicionDestino = rawProducts[0]?.id_bodega_destino || "";
                            sections.push({
                                barcode: "",
                                error: "",
                                produtos: sectionProducts,
                                soundEnabled: true,
                                totalEscaneado: sectionProducts.reduce((sum, p) => sum + p.quantidade, 0),
                                posicionOrigen,
                                posicionDestino,
                            });
                        }
                    });
                    // Ahora, utilizar el array de productos_seccion_0 para la primera sección
                    if (t["productos_seccion_0"]?.length > 0) {
                        const rawProducts = Array.isArray(t["productos_seccion_0"]) ? t["productos_seccion_0"] : [];
                        const mapped: Producto[] = rawProducts.map((p: any) => ({
                            id: p.id_producto,
                            sku: p.sku,
                            quantidade: parseInt(p.cantidad_transferir),
                            quantidadeDisponivel: parseInt(p.cantidad_disponible),
                            observacion: p.observacion || ''
                        }));
                        // Colocar esta sección en la primera posición
                        sections.unshift({
                            barcode: "",
                            error: "",
                            produtos: mapped,
                            soundEnabled: true,
                            totalEscaneado: mapped.reduce((sum, p) => sum + p.quantidade, 0),
                            posicionOrigen: rawProducts[0]?.id_bodega_origen || "",
                            posicionDestino: rawProducts[0]?.id_bodega_destino || ""
                        });
                    } else if (t.productos?.length > 0) {
                        // Si no existe productos_seccion_0, se utiliza el array de productos principal
                        const mapped: Producto[] = t.productos.map((p: any) => ({
                            id: p.id_producto,
                            sku: p.sku,
                            quantidade: parseInt(p.cantidad_transferir),
                            quantidadeDisponivel: parseInt(p.cantidad_disponible),
                            observacion: p.observacion || ''
                        }));
                        sections.unshift({
                            barcode: "",
                            error: "",
                            produtos: mapped,
                            soundEnabled: true,
                            totalEscaneado: mapped.reduce((sum, p) => sum + p.quantidade, 0),
                            posicionOrigen: t.id_bodega_origen || "",
                            posicionDestino: t.id_bodega_destino || ""
                        });
                    }
                    if (sections.length > 0) {
                        setTransferSections(sections);
                    }
                }
            }
        } catch (e) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível carregar os dados da transferência."
            });
        } finally {
            setLoading(false);
        }
    }, [id, token, toast]);

    const fetchSources = useCallback(async () => {
        try {
            const items: Source[] = await transferBodegasApi.getOrigens();
            setSources(items);
        } catch (e) {
            console.error('Erro ao buscar fontes:', e);
        }
    }, []);

    const fetchBodegasMercancia = useCallback(async (source: string) => {
        try {
            const bodegas = await transferBodegasApi.getBodegasMercancia(source);
            setBodegasForSource(bodegas);
        } catch (e) {
            console.error("Error al cargar bodegas de mercancia:", e);
        }
    }, []);

    useEffect(() => {
        fetchTransferencia();
        fetchSources();
    }, [fetchTransferencia, fetchSources]);

    useEffect(() => {
        if (transferencia?.soruce && bodegasForSource.length === 0) {
            fetchBodegasMercancia(transferencia.soruce);
        }
    }, [transferencia, bodegasForSource, fetchBodegasMercancia]);

    const getSourceName = (code: string) => {
        const src = sources.find(s => s.source_code === code);
        return src?.name || code;
    };

    // Manejo de escaneo en la sección principal
    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim()) return;
        try {
            const bodegaOrigen = transferencia.trasferencia_total === "1" ? posicionOrigenMain : transferencia.id_bodega_origen;
            const bodegaDestino = transferencia.trasferencia_total === "1" ? posicionDestinoMain : transferencia.id_bodega_destino;
            const data = await transferBodegasApi.scanBarcode(barcode, bodegaOrigen, bodegaDestino, transferencia.soruce, 1);
            if (!Array.isArray(data) || !data[0]?.success) throw new Error("Producto no encontrado");
            const result = data[0];
            const qtyAvailable = parseInt(result.cantidad_disponible, 10);
            setProdutos(prev => processScanResults(prev, result, qtyAvailable));
            playBeep(true);
            setError('');
            setBarcode('');
        } catch (err: any) {
            setError(err.message);
            playBeep(false);
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    };

    // Manejo de escaneo en secciones adicionales
    const handleBarcodeSubmitAdd = async (e: React.FormEvent, index: number) => {
        e.preventDefault();
        const section = transferSections[index];
        if (!section.barcode.trim()) return;
        try {
            const data = await transferBodegasApi.scanBarcode(
                section.barcode,
                section.posicionOrigen,
                section.posicionDestino,
                transferencia.soruce,
                1
            );
            if (!Array.isArray(data) || !data[0]?.success) throw new Error("Producto no encontrado");
            const result = data[0];
            const qtyAvailable = parseInt(result.cantidad_disponible, 10);
            updateSection(index, {
                produtos: processScanResults(section.produtos, result, qtyAvailable),
                error: "",
                barcode: "",
                totalEscaneado: section.totalEscaneado + 1
            });
            playBeep(true);
        } catch (err: any) {
            const errorMsg = 'No hay producto con ese código de barras o no tiene una cantidad disponible';
            updateSection(index, { error: errorMsg });
            playBeep(false);
        }
    };

    const handleSave = async () => {
        if (!transferencia) return;
        setSaving(true);
        try {
            const baseData: any = {
                transferencia_id: parseInt(transferencia.transferencia_bodega_id),
                soruce: transferencia.soruce,
                responsable: transferencia.responsable,
                nombre_responsable: transferencia.nombre_responsable,
                // Por defecto se toman de la transferencia, pero se sobreescriben si trasferencia_total es "1"
                id_bodega_origen: parseInt(transferencia.id_bodega_origen),
                id_bodega_destino: parseInt(transferencia.id_bodega_destino),
                descripcion: transferencia.descripcion,
                estado: transferencia.estado,
                trasferencia_total: transferencia.trasferencia_total,
                productos: produtos.map(p => ({
                    producto: "",
                    id_producto: p.id,
                    cantidad_transferir: p.quantidade,
                    cantidad_existente: p.quantidadeDisponivel,
                    observacion: p.observacion,
                    sku: p.sku
                }))
            };
    
            // Si transferencia_total es "1", se toman los id seleccionados para Posición Origen y Destino
            if (transferencia.trasferencia_total === "1") {
                // Reemplazar la bodega principal con la seleccionada en los selects
                baseData.id_bodega_origen = parseInt(posicionOrigenMain);
                baseData.id_bodega_destino = parseInt(posicionDestinoMain);
                
                transferSections.forEach((section, index) => {
                    const sessionNumber = index; // Comienza en 0
                    baseData[`productos_sesion_${sessionNumber}`] = section.produtos.map(p => ({
                        producto: "",
                        id_producto: p.id,
                        cantidad_transferir: p.quantidade,
                        cantidad_existente: p.quantidadeDisponivel,
                        observacion: p.observacion,
                        sku: p.sku,
                        session: sessionNumber,
                        id_bodega_origen: section.posicionOrigen,
                        id_bodega_destino: section.posicionDestino
                    }));
                    // Agregar las bodegas seleccionadas para cada sección usando claves dinámicas
                    // baseData[`id_bodega_origen_sesion_${sessionNumber}`] = section.posicionOrigen;
                    // baseData[`id_bodega_destino_sesion_${sessionNumber}`] = section.posicionDestino;
                });
            }
    
            const payload = { data: baseData };
            console.log('Payload para guardar transferencia:', payload);
    
            const [success, updatedId] = await transferBodegasApi.updateTransferenciaPut(payload);
            if (!success) throw new Error('Error al guardar la transferencia');
            toast({ title: "Éxito", description: `Transferencia actualizada correctamente con ID: ${updatedId}` });
        } catch (e) {
            console.error('Error al guardar transferencia:', e);
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la transferencia" });
        } finally {
            setSaving(false);
        }
    };

    const handleCompletar = () => {
        if (transferencia) {
            navigate(`/dashboard/transferencia-mercancia/${transferencia.transferencia_bodega_id}/confirmar`);
        }
    };

    // Actualización inmutable de productos
    const incrementarQuantidade = (id: string) => {
        setProdutos(prev => prev.map(p =>
            p.id === id && p.quantidade < p.quantidadeDisponivel
                ? { ...p, quantidade: p.quantidade + 1 }
                : p
        ));
    };

    const decrementarQuantidade = (id: string) => {
        setProdutos(prev => prev.map(p =>
            p.id === id && p.quantidade > 1
                ? { ...p, quantidade: p.quantidade - 1 }
                : p
        ));
    };

    const removerProduto = (id: string) => {
        setProdutos(prev => prev.filter(p => p.id !== id));
    };

    const handleObservacionChange = (id: string, observacion: string) => {
        setProdutos(prev => prev.map(p => p.id === id ? { ...p, observacion } : p));
    };

    const playBeep = (success: boolean) => {
        if (!soundEnabled) return;
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.type = success ? 'sine' : 'square';
            oscillator.frequency.setValueAtTime(success ? 800 : 400, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.error('Erro ao reproduzir som:', e);
        }
    };

    // Funciones para secciones adicionales
    const addTransferSection = () => {
        setTransferSections(prev => [
            ...prev,
            {
                barcode: '',
                error: '',
                produtos: [],
                soundEnabled: true,
                totalEscaneado: 0,
                posicionOrigen: '',
                posicionDestino: ''
            }
        ]);
        toast({ title: "Sección agregada", description: "Sección de transferencia adicional agregada." });
    };

    // Función para actualizar una sección adicional
    const updateSection = (index: number, updates: Partial<TransferSection>) => {
        setTransferSections(prev =>
            prev.map((section, i) => i === index ? { ...section, ...updates } : section)
        );
    };

    // Función para actualizar posición en una sección adicional
    const updateSectionPosition = (index: number, field: 'posicionOrigen' | 'posicionDestino', value: string) => {
        const conflict = transferSections.some((sec, i) => i !== index && sec[field] === value);
        if (conflict) {
            toast({
                variant: "destructive",
                title: "Error",
                description: `La ${field === 'posicionOrigen' ? 'Posición Origen' : 'Posición Destino'} ya ha sido utilizada en otra sección`
            });
            return;
        }
        if (transferSections[index][field] && transferSections[index][field] !== value) {
            const confirmChange = window.confirm("Se borrarán todos los registros de la tabla. ¿Desea continuar?");
            if (!confirmChange) return;
        }
        updateSection(index, { [field]: value, produtos: [], totalEscaneado: 0 });
    };

    const removeTransferSection = (index: number) => {
        setTransferSections(prev => prev.filter((_, i) => i !== index));
        toast({ title: "Sección eliminada", description: "Sección de transferencia adicional eliminada.", variant: "destructive" });
    };

    if (loading || !transferencia) {
        return <div>Carregando...</div>;
    }

    const totalEscaneado = produtos.reduce((sum, p) => sum + p.quantidade, 0);
    const hasDataForCompletar = transferencia.trasferencia_total === "1" 
        ? transferSections.some(section => section.produtos.length > 0)
        : produtos.length > 0;

    return (
        <div className="mx-auto py-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ejecutar Transferencia</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/dashboard/transferencia-mercancia')}>
                        Regresar
                    </Button>
                    {transferencia.estado !== 'f' && (
                        <>
                            {transferencia.es_masiva !== "s" && (
                                <Button onClick={handleSave} variant="secondary" disabled={saving || (!produtos.length && transferencia.trasferencia_total !== "1")}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : 'Guardar'}
                                </Button>
                            )}
                            <Button className="bg-ecommerce-500 hover:bg-ecommerce-600"
                                onClick={handleCompletar} disabled={!hasDataForCompletar}   >
                                  
                                Completar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Datos principales de la transferencia */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <div className="mb-4">
                            <Label className="text-sm text-gray-500">Origen</Label>
                            <div className="font-medium">{getSourceName(transferencia.soruce)}</div>
                        </div>
                        <div className="mb-4">
                            <Label className="text-sm text-gray-500">Usuario Responsable</Label>
                            <div className="font-medium">{transferencia.nombre_responsable}</div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-500">Descripción</Label>
                            <div className="font-medium">{transferencia.descripcion}</div>
                        </div>
                        <div className="mb-4">
                            <Label className="text-sm text-gray-500">Bodega Origen</Label>
                            <div className="font-medium">
                                {transferencia.es_masiva === "s" || transferencia.trasferencia_total === '1' ? "-" : transferencia.nombre_bodega_origen}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="mb-4">
                            <Label className="text-sm text-gray-500">Consecutivo</Label>
                            <div className="font-medium">{transferencia.codigo}</div>
                        </div>
                        <div className="mb-4">
                            <Label className="text-sm text-gray-500">Fecha</Label>
                            <div className="font-medium">{transferencia.fecha ? transferencia.fecha.split(" ")[0] : 'N/A'}</div>
                        </div>
                        <div className="mb-4">
                            <Label className="text-sm text-gray-500">Estado</Label>
                            <div className="font-medium">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    transferencia.estado === 'n' ? 'bg-blue-100 text-blue-800'
                                    : transferencia.estado === 'p' ? 'bg-yellow-100 text-yellow-800'
                                    : transferencia.estado === 'c' ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                    {transferencia.estado === 'n' ? 'Nuevo' : transferencia.estado === 'p' ? 'En Proceso' : transferencia.estado === 'c' ? 'En Proceso' : 'Finalizado'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-gray-500">Bodega Destino</Label>
                            <div className="font-medium">
                                {transferencia.es_masiva === "s" || transferencia.trasferencia_total === '1' ? "-" : transferencia.nombre_bodega_destino}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm text-gray-500">Es masiva</Label>
                        <div className="font-medium">{transferencia.es_masiva === 's' ? 'Si' : 'No'}</div>
                    </div>
                </div>
            </div>

            {/* Sección principal: Sonido, Total Escaneado y selects de bodegas */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled}
                        disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'} />
                    <Label htmlFor="sound">Sonido</Label>
                </div>
                <div className="text-sm text-gray-500">
                    Total Escaneado: <span className="font-bold">{totalEscaneado}</span>
                </div>
            </div>

            {/* Renderizar selects de bodega solo para transferencia total */}
            {transferencia.trasferencia_total === "1" && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <Label className="text-sm text-gray-500">Posición Origen</Label>
                        <Select value={posicionOrigenMain} onValueChange={setPosicionOrigenMain}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar posición origen" />
                            </SelectTrigger>
                            <SelectContent>
                                {bodegasForSource.map(b => (
                                    <SelectItem key={b.bodega_id} value={String(b.bodega_id)}>
                                        {b.bodega_nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-sm text-gray-500">Posición Destino</Label>
                        <Select value={posicionDestinoMain} onValueChange={setPosicionDestinoMain}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar posición destino" />
                            </SelectTrigger>
                            <SelectContent>
                                {bodegasForSource.map(b => (
                                    <SelectItem key={b.bodega_id} value={String(b.bodega_id)}>
                                        {b.bodega_nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Sección principal: Transferencia de productos (se oculta si ya existe productos_seccion_0) */}
            {transferencia.trasferencia_total !== "1" && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Transferencia de productos</h2>
                    <form onSubmit={handleBarcodeSubmit} className="mb-6">
                        <div className="flex gap-4 items-center max-w-xl">
                            <Input
                                type="text"
                                placeholder="Escanear o ingresar código de barras o SKU del producto"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                className="flex-1"
                                autoFocus
                                disabled={transferencia.estado === 'f' || transferencia.es_masiva === "s"}
                            />
                            <Button type="submit" variant="secondary"
                                disabled={transferencia.estado === 'f' || transferencia.es_masiva === "s"}>
                                Adicionar
                            </Button>
                        </div>
                    </form>
                    {error && <div className="text-red-500 mb-4">{error}</div>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Producto</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Cantidad Disponible</TableHead>
                                <TableHead>Cantidad a Transferir</TableHead>
                                <TableHead>Observación</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {produtos.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.id}</TableCell>
                                    <TableCell>{p.sku}</TableCell>
                                    <TableCell>{p.quantidadeDisponivel}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm"
                                                onClick={() => decrementarQuantidade(p.id)}
                                                disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'}>
                                                -
                                            </Button>
                                            <span>{p.quantidade}</span>
                                            <Button variant="outline" size="sm"
                                                onClick={() => incrementarQuantidade(p.id)}
                                                disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'}>
                                                +
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="text"
                                            placeholder="Agregar observación"
                                            value={p.observacion}
                                            onChange={(e) => handleObservacionChange(p.id, e.target.value)}
                                            className="max-w-[200px]"
                                            disabled={transferencia.es_masiva === "s" || transferencia.estado === 'f'}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm"
                                            onClick={() => removerProduto(p.id)}
                                            disabled={transferencia.estado === 'f' || transferencia.es_masiva === "s"}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Secciones adicionales */}
            {transferencia.trasferencia_total === "1" && (
                <>
                    <div className="mt-8">
                        {transferSections.map((section, index) => (
                             <div key={index} className="bg-white rounded-lg shadow p-6 mb-6 mt-4 relative">
                             <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 onClick={() => removeTransferSection(index)} 
                                 className="absolute top-2 right-2"
                             >
                                 <X className="h-4 w-4" />
                             </Button>
                             <h2 className="text-lg font-semibold mb-4">
                                 Transferencia de productos - Sección Adicional {index}
                             </h2>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id={`sound-add-${index}`} 
                                            checked={section.soundEnabled}
                                            onCheckedChange={(checked) => updateSection(index, { soundEnabled: checked })}
                                        />
                                        <Label htmlFor={`sound-add-${index}`}>Sonido</Label>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Total Escaneado: <span className="font-bold">{section.totalEscaneado}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {["posicionOrigen", "posicionDestino"].map((field) => (
                                        <div key={field}>
                                            <Label className="text-sm text-gray-500">
                                                {field === "posicionOrigen" ? "Posición Origen" : "Posición Destino"}
                                            </Label>
                                            <Select 
                                                value={section[field as keyof TransferSection] as string} 
                                                onValueChange={(value) =>
                                                    updateSectionPosition(index, field as 'posicionOrigen' | 'posicionDestino', value)
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={`Seleccionar ${field === "posicionOrigen" ? "origen" : "destino"}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {bodegasForSource.map(b => (
                                                        <SelectItem key={b.bodega_id} value={String(b.bodega_id)}>
                                                            {b.bodega_nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={(e) => handleBarcodeSubmitAdd(e, index)} className="mb-6">
                                    <div className="flex gap-4 items-center max-w-xl">
                                        <Input
                                            type="text"
                                            placeholder="Escanear o ingresar código de barras"
                                            value={section.barcode}
                                            onChange={(e) => updateSection(index, { barcode: e.target.value })}
                                            className="flex-1"
                                            autoFocus
                                        />
                                        <Button type="submit" variant="secondary">
                                            Adicionar
                                        </Button>
                                    </div>
                                </form>
                                {section.error && <div className="text-red-500 mb-4">{section.error}</div>}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID Producto</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Cantidad Disponible</TableHead>
                                            <TableHead>Cantidad a Transferir</TableHead>
                                            <TableHead>Observación</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {section.produtos.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.id}</TableCell>
                                                <TableCell>{p.sku}</TableCell>
                                                <TableCell>{p.quantidadeDisponivel}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => updateSection(index, {
                                                                produtos: section.produtos.map(pp =>
                                                                    pp.id === p.id && p.quantidade > 1
                                                                        ? { ...pp, quantidade: pp.quantidade - 1 }
                                                                        : pp
                                                                )
                                                            })}
                                                            disabled={transferencia.estado === 'f'}
                                                        >
                                                            -
                                                        </Button>
                                                        <span>{p.quantidade}</span>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => updateSection(index, {
                                                                produtos: section.produtos.map(pp =>
                                                                    pp.id === p.id && pp.quantidade < pp.quantidadeDisponivel
                                                                        ? { ...pp, quantidade: pp.quantidade + 1 }
                                                                        : pp
                                                                )
                                                            })}
                                                            disabled={transferencia.estado === 'f'}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="text"
                                                        placeholder="Agregar observación"
                                                        value={p.observacion}
                                                        onChange={(e) => updateSection(index, {
                                                            produtos: section.produtos.map(pp =>
                                                                pp.id === p.id ? { ...pp, observacion: e.target.value } : pp
                                                            )
                                                        })}
                                                        className="max-w-[200px]"
                                                        disabled={transferencia.estado === 'f'}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => updateSection(index, {
                                                            produtos: section.produtos.filter(pp => pp.id !== p.id)
                                                        })}
                                                        disabled={transferencia.estado === 'f'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                    </div>
                    <Button onClick={addTransferSection} className="bg-green-500 hover:bg-green-600 text-white">
                        Agregar sección de transferencia adicional
                    </Button>
                </>
            )}
        </div>
    );
};

export default ExecutarTransferencia;