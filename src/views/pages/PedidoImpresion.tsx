import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRINTING_SIZES } from '../../shared/printingSizes';
import { apiFetch } from '../lib/apiFetch';
import './PedidoImpresion.css';

interface PrecioImpresion {
    fechaDesde: string;
    tamanio: string;
    precioTamanio: number | string;
    precioByN: number | string;
    precioColor: number | string;
    factorGanancia: number | string;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function PedidoImpresion() {
    const navigate = useNavigate();
    const [precios, setPrecios] = useState<PrecioImpresion[]>([]);
    const [tamanio, setTamanio] = useState('');
    const [tipoColor, setTipoColor] = useState<'blanco y negro' | 'color'>('blanco y negro');
    const [faz, setFaz] = useState<'simple' | 'doble'>('simple');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [cantidadHojas, setCantidadHojas] = useState<number | null>(null);
    const [observacion, setObservacion] = useState('');
    const [cargandoPrecios, setCargandoPrecios] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const cargarPrecios = async () => {
            try {
                const response = await apiFetch('/api/precios-impresiones');
                if (!response.ok) throw new Error('No se pudieron cargar los precios de impresión.');
                setPrecios(await response.json());
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Error al cargar los precios.');
            } finally {
                setCargandoPrecios(false);
            }
        };
        void cargarPrecios();
    }, []);

    const precioActual = useMemo(
        () => precios.find((precio) => precio.tamanio === tamanio),
        [precios, tamanio],
    );
    const cantCopias = cantidadHojas === null
        ? null
        : faz === 'doble'
            ? Math.ceil(cantidadHojas / 2)
            : cantidadHojas;
    const subtotal = useMemo(() => {
        if (!precioActual || cantCopias === null) return null;
        const precioCopia = tipoColor === 'color'
            ? Number(precioActual.precioColor)
            : Number(precioActual.precioByN);
        const total = cantCopias *
            (Number(precioActual.precioTamanio) + precioCopia) *
            Number(precioActual.factorGanancia);
        return Math.round((total + Number.EPSILON) * 100) / 100;
    }, [cantCopias, precioActual, tipoColor]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;
        setArchivo(selectedFile);
        setCantidadHojas(null);
        setError(null);
        if (!selectedFile) return;

        if (!/\.pdf$/i.test(selectedFile.name)) {
            setArchivo(null);
            setError('El archivo debe tener extensión .pdf.');
            event.target.value = '';
            return;
        }
        if (selectedFile.size > MAX_FILE_BYTES) {
            setArchivo(null);
            setError('El archivo no puede superar los 20 MB.');
            event.target.value = '';
            return;
        }

        try {
            const [{ GlobalWorkerOptions, getDocument }, pdfWorker] = await Promise.all([
                import('pdfjs-dist'),
                import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
            ]);
            GlobalWorkerOptions.workerSrc = pdfWorker.default;
            const task = getDocument({ data: await selectedFile.arrayBuffer() });
            const pdf = await task.promise;
            setCantidadHojas(pdf.numPages);
            await task.destroy();
        } catch {
            setArchivo(null);
            setError('No se pudo leer el PDF. Verificá que el archivo no esté dañado.');
            event.target.value = '';
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!archivo || cantCopias === null || !precioActual) return;
        setEnviando(true);
        setError(null);

        const formData = new FormData();
        formData.append('archivo', archivo, archivo.name);
        formData.append('tamanio', tamanio);
        formData.append('tipoColor', tipoColor);
        formData.append('faz', faz);
        formData.append('cantCopias', String(cantCopias));
        if (observacion.trim()) formData.append('observacion', observacion.trim());

        try {
            const response = await apiFetch('/api/pedidos/impresion', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.message || 'No se pudo crear el pedido de impresión.');
            }
            const createdOrder = await response.json();
            navigate('/perfil', { state: { nuevoPedidoId: createdOrder.IDPedido } });
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Error al crear el pedido.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <main className="print-order-container">
            <header className="print-order-header">
                <h1>Pedido de impresión</h1>
                <p>Completá las opciones y adjuntá el documento PDF que querés imprimir.</p>
            </header>

            {error && <p className="print-order-error" role="alert">{error}</p>}

            <form className="print-order-form" onSubmit={handleSubmit}>
                <label>
                    Tamaño de papel
                    <select value={tamanio} onChange={(event) => setTamanio(event.target.value)} required>
                        <option value="" disabled>Seleccionar tamaño</option>
                        {PRINTING_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                </label>

                <fieldset>
                    <legend>Impresión</legend>
                    <label>
                        Color
                        <select
                            value={tipoColor}
                            onChange={(event) => setTipoColor(event.target.value as 'blanco y negro' | 'color')}
                        >
                            <option value="blanco y negro">Blanco y negro</option>
                            <option value="color">Color</option>
                        </select>
                    </label>
                    <label>
                        Faz
                        <select
                            value={faz}
                            onChange={(event) => setFaz(event.target.value as 'simple' | 'doble')}
                        >
                            <option value="simple">Simple faz</option>
                            <option value="doble">Doble faz</option>
                        </select>
                    </label>
                </fieldset>

                <label>
                    Archivo PDF (máximo 20 MB)
                    <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        required
                    />
                </label>

                {cantidadHojas !== null && cantCopias !== null && (
                    <p className="print-order-pages" role="status">
                        El PDF tiene {cantidadHojas} hojas; se cobrarán {cantCopias} copias
                        {faz === 'doble' ? ' (doble faz, redondeado hacia arriba)' : ''}.
                    </p>
                )}

                <label>
                    Observación (opcional)
                    <textarea
                        value={observacion}
                        onChange={(event) => setObservacion(event.target.value)}
                        maxLength={2000}
                        rows={4}
                    />
                </label>

                <div className="print-order-summary">
                    {cargandoPrecios ? (
                        <span>Consultando precios...</span>
                    ) : precioActual && subtotal !== null ? (
                        <>
                            <span>Subtotal estimado</span>
                            <strong>
                                ${subtotal.toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </strong>
                        </>
                    ) : (
                        <span>
                            {tamanio
                                ? `No hay un precio configurado para ${tamanio}.`
                                : 'Seleccioná un tamaño para consultar el precio.'}
                        </span>
                    )}
                </div>

                <button
                    className="print-order-submit"
                    type="submit"
                    disabled={enviando || cargandoPrecios || !precioActual || cantCopias === null}
                >
                    {enviando ? 'Enviando pedido...' : 'Crear pedido de impresión'}
                </button>
                <p className="print-order-price-note">
                    El subtotal final se calcula en el servidor con el precio vigente al confirmar el pedido.
                </p>
            </form>
        </main>
    );
}
