import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRINTING_SIZES } from '../../shared/printingSizes';
import { apiFetch } from '../lib/apiFetch';
import './PrintOrder.css';

export interface PrintingPrice {
    fechaDesde: string;
    tamanio: string;
    precioTamanio: number | string;
    precioByN: number | string;
    precioColor: number | string;
    factorGanancia: number | string;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function PrintOrder() {
    const navigate = useNavigate();
    const [prices, setPrices] = useState<PrintingPrice[]>([]);
    const [size, setSize] = useState('');
    const [colorType, setColorType] = useState<'blanco y negro' | 'color'>('blanco y negro');
    const [side, setSide] = useState<'simple' | 'doble'>('simple');
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [note, setNote] = useState('');
    const [loadingPrices, setLoadingPrices] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPrices = async () => {
            try {
                const response = await apiFetch('/api/precios-impresiones');
                if (!response.ok) throw new Error('No se pudieron cargar los precios de impresión.');
                setPrices(await response.json());
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Error al cargar los precios.');
            } finally {
                setLoadingPrices(false);
            }
        };
        void loadPrices();
    }, []);

    const currentPrice = useMemo(
        () => prices.find((price) => price.tamanio === size),
        [prices, size],
    );
    const copiesCount = pageCount === null
        ? null
        : side === 'doble'
            ? Math.ceil(pageCount / 2)
            : pageCount;
    const subtotal = useMemo(() => {
        if (!currentPrice || copiesCount === null) return null;
        const copyPrice = colorType === 'color'
            ? Number(currentPrice.precioColor)
            : Number(currentPrice.precioByN);
        const total = copiesCount *
            (Number(currentPrice.precioTamanio) + copyPrice) *
            Number(currentPrice.factorGanancia);
        return Math.round((total + Number.EPSILON) * 100) / 100;
    }, [copiesCount, currentPrice, colorType]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;
        setFile(selectedFile);
        setPageCount(null);
        setError(null);
        if (!selectedFile) return;

        if (!/\.pdf$/i.test(selectedFile.name)) {
            setFile(null);
            setError('El archivo debe tener extensión .pdf.');
            event.target.value = '';
            return;
        }
        if (selectedFile.size > MAX_FILE_BYTES) {
            setFile(null);
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
            setPageCount(pdf.numPages);
            await task.destroy();
        } catch {
            setFile(null);
            setError('No se pudo leer el PDF. Verificá que el archivo no esté dañado.');
            event.target.value = '';
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!file || copiesCount === null || !currentPrice) return;
        setSending(true);
        setError(null);

        const formData = new FormData();
        formData.append('archivo', file, file.name);
        formData.append('tamanio', size);
        formData.append('tipoColor', colorType);
        formData.append('faz', side);
        formData.append('cantCopias', String(copiesCount));
        if (note.trim()) formData.append('observacion', note.trim());

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
            setSending(false);
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
                    <select value={size} onChange={(event) => setSize(event.target.value)} required>
                        <option value="" disabled>Seleccionar tamaño</option>
                        {PRINTING_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>

                <fieldset>
                    <legend>Impresión</legend>
                    <label>
                        Color
                        <select
                            value={colorType}
                            onChange={(event) => setColorType(event.target.value as 'blanco y negro' | 'color')}
                        >
                            <option value="blanco y negro">Blanco y negro</option>
                            <option value="color">Color</option>
                        </select>
                    </label>
                    <label>
                        Faz
                        <select
                            value={side}
                            onChange={(event) => setSide(event.target.value as 'simple' | 'doble')}
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

                {pageCount !== null && copiesCount !== null && (
                    <p className="print-order-pages" role="status">
                        El PDF tiene {pageCount} paginas; se cobrarán {copiesCount} copias
                        {side === 'doble' ? ' (Doble faz)' : ' (Simple Faz)'}.
                    </p>
                )}

                <label>
                    Observación (opcional)
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        maxLength={2000}
                        rows={4}
                    />
                </label>

                <div className="print-order-summary">
                    {loadingPrices ? (
                        <span>Consultando precios...</span>
                    ) : currentPrice && subtotal !== null ? (
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
                            {size
                                ? `No hay un precio configurado para ${size}.`
                                : 'Seleccioná un tamaño para consultar el precio.'}
                        </span>
                    )}
                </div>

                <button
                    className="print-order-submit"
                    type="submit"
                    disabled={sending || loadingPrices || !currentPrice || copiesCount === null}
                >
                    {sending ? 'Enviando pedido...' : 'Crear pedido de impresión'}
                </button>
            </form>
        </main>
    );
}
