import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import { PRINTING_SIZES } from '../../../shared/printingSizes';
import './AdminPrintingPrices.css';

export interface PrintingPrice {
    fechaDesde: string;
    tamanio: string;
    precioTamanio: number | string;
    precioByN: number | string;
    precioColor: number | string;
    factorGanancia: number | string;
}

export interface PriceFormData {
    tamanio: string;
    precioTamanio: string;
    precioByN: string;
    precioColor: string;
    factorGanancia: string;
}

const emptyFormData: PriceFormData = {
    tamanio: '',
    precioTamanio: '',
    precioByN: '',
    precioColor: '',
    factorGanancia: '1',
};

function formatAmount(value: number | string): string {
    return Number(value).toFixed(2);
}

export function AdminPrintingPrices() {
    const [prices, setPrices] = useState<PrintingPrice[]>([]);
    const [formData, setFormData] = useState<PriceFormData>(emptyFormData);
    const [editingPrice, setEditingPrice] = useState<PrintingPrice | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const loadPrices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch('/api/precios-impresiones');
            if (!response.ok) throw new Error('No se pudieron cargar los precios de impresión.');
            setPrices(await response.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar los precios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadPrices();
    }, []);

    const startEdit = (price: PrintingPrice) => {
        setEditingPrice(price);
        setFormData({
            tamanio: price.tamanio,
            precioTamanio: String(price.precioTamanio),
            precioByN: String(price.precioByN),
            precioColor: String(price.precioColor),
            factorGanancia: String(price.factorGanancia),
        });
        setError(null);
        setMessage(null);
    };

    const cancelEdit = () => {
        setEditingPrice(null);
        setFormData(emptyFormData);
        setError(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setMessage(null);

        const payload = {
            tamanio: formData.tamanio.trim(),
            precioTamanio: Number(formData.precioTamanio),
            precioByN: Number(formData.precioByN),
            precioColor: Number(formData.precioColor),
            factorGanancia: Number(formData.factorGanancia),
        };

        try {
            const url = editingPrice
                ? `/api/precios-impresiones/${encodeURIComponent(editingPrice.tamanio)}/${encodeURIComponent(editingPrice.fechaDesde)}`
                : '/api/precios-impresiones';
            const response = await apiFetch(url, {
                method: editingPrice ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(
                    errorBody.message ||
                    (editingPrice ? 'No se pudo actualizar el precio.' : 'No se pudo crear el precio.'),
                );
            }

            setMessage(editingPrice ? 'Precio actualizado. La fecha de creación se conservó.' : 'Nuevo precio creado.');
            setEditingPrice(null);
            setFormData(emptyFormData);
            await loadPrices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar el precio.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="admin-section">
            <header className="section-header-row">
                <h2 className="section-title">Precios de impresión</h2>
            </header>

            <p className="printing-prices-note">
                Los precios se pueden crear o actualizar, pero no eliminar. Al editar, la fecha de creación no cambia.
            </p>

            {error && <p className="printing-prices-message is-error" role="alert">{error}</p>}
            {message && <p className="printing-prices-message is-success" role="status">{message}</p>}

            <form className="printing-price-form" onSubmit={handleSubmit}>
                <h3>{editingPrice ? 'Actualizar precio' : 'Crear precio'}</h3>
                {editingPrice && (
                    <p className="printing-price-created">
                        Creado el {editingPrice.fechaDesde}; esta fecha no se puede modificar.
                    </p>
                )}
                <div className="printing-price-fields">
                    <label>
                        Tamaño
                        <select
                            value={formData.tamanio}
                            onChange={(event) => setFormData({ ...formData, tamanio: event.target.value })}
                            required
                        >
                            <option value="" disabled>Seleccionar tamaño</option>
                            {PRINTING_SIZES.map((tamanio) => (
                                <option key={tamanio} value={tamanio}>{tamanio}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Precio tamaño
                        <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            value={formData.precioTamanio}
                            onChange={(event) => setFormData({ ...formData, precioTamanio: event.target.value })}
                            required
                        />
                    </label>
                    <label>
                        Precio blanco y negro
                        <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            value={formData.precioByN}
                            onChange={(event) => setFormData({ ...formData, precioByN: event.target.value })}
                            required
                        />
                    </label>
                    <label>
                        Precio color
                        <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            value={formData.precioColor}
                            onChange={(event) => setFormData({ ...formData, precioColor: event.target.value })}
                            required
                        />
                    </label>
                    <label>
                        Factor de ganancia (1 a 10)
                        <input
                            type="number"
                            min="1"
                            max="10"
                            step="0.01"
                            value={formData.factorGanancia}
                            onChange={(event) => setFormData({ ...formData, factorGanancia: event.target.value })}
                            required
                        />
                    </label>
                </div>
                <div className="printing-price-actions">
                    <button className="btn-save-submit" type="submit" disabled={saving}>
                        {saving ? 'Guardando...' : editingPrice ? 'Guardar cambios' : 'Crear precio'}
                    </button>
                    {editingPrice && (
                        <button className="btn-cancel-action" type="button" onClick={cancelEdit} disabled={saving}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <div className="printing-prices-table-wrap">
                {loading ? (
                    <p className="empty-state">Cargando precios...</p>
                ) : prices.length === 0 ? (
                    <p className="empty-state">Todavía no hay precios de impresión.</p>
                ) : (
                    <table className="printing-prices-table">
                        <thead>
                            <tr>
                                <th>Tamaño</th>
                                <th>Fecha de creación</th>
                                <th>Precio tamaño</th>
                                <th>Blanco y negro</th>
                                <th>Color</th>
                                <th>Factor</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prices.map((price) => (
                                <tr key={`${price.tamanio}-${price.fechaDesde}`}>
                                    <td>{price.tamanio}</td>
                                    <td>{price.fechaDesde}</td>
                                    <td>${formatAmount(price.precioTamanio)}</td>
                                    <td>${formatAmount(price.precioByN)}</td>
                                    <td>${formatAmount(price.precioColor)}</td>
                                    <td>{formatAmount(price.factorGanancia)}</td>
                                    <td>
                                        <button
                                            className="btn-card-action btn-card-edit"
                                            type="button"
                                            onClick={() => startEdit(price)}
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}
