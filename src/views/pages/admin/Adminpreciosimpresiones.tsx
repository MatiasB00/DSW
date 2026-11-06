import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import { PRINTING_SIZES } from '../../../shared/printingSizes';
import './Adminpreciosimpresiones.css';

interface PrecioImpresion {
    fechaDesde: string;
    tamanio: string;
    precioTamanio: number | string;
    precioByN: number | string;
    precioColor: number | string;
    factorGanancia: number | string;
}

interface FormPrecio {
    tamanio: string;
    precioTamanio: string;
    precioByN: string;
    precioColor: string;
    factorGanancia: string;
}

const formularioVacio: FormPrecio = {
    tamanio: '',
    precioTamanio: '',
    precioByN: '',
    precioColor: '',
    factorGanancia: '1',
};

function formatearImporte(value: number | string): string {
    return Number(value).toFixed(2);
}

export function AdminPreciosImpresiones() {
    const [precios, setPrecios] = useState<PrecioImpresion[]>([]);
    const [formulario, setFormulario] = useState<FormPrecio>(formularioVacio);
    const [precioEditado, setPrecioEditado] = useState<PrecioImpresion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);

    const cargarPrecios = async () => {
        setCargando(true);
        setError(null);
        try {
            const response = await apiFetch('/api/precios-impresiones');
            if (!response.ok) throw new Error('No se pudieron cargar los precios de impresión.');
            setPrecios(await response.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar los precios.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        void cargarPrecios();
    }, []);

    const iniciarEdicion = (precio: PrecioImpresion) => {
        setPrecioEditado(precio);
        setFormulario({
            tamanio: precio.tamanio,
            precioTamanio: String(precio.precioTamanio),
            precioByN: String(precio.precioByN),
            precioColor: String(precio.precioColor),
            factorGanancia: String(precio.factorGanancia),
        });
        setError(null);
        setMensaje(null);
    };

    const cancelarEdicion = () => {
        setPrecioEditado(null);
        setFormulario(formularioVacio);
        setError(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setGuardando(true);
        setError(null);
        setMensaje(null);

        const payload = {
            tamanio: formulario.tamanio.trim(),
            precioTamanio: Number(formulario.precioTamanio),
            precioByN: Number(formulario.precioByN),
            precioColor: Number(formulario.precioColor),
            factorGanancia: Number(formulario.factorGanancia),
        };

        try {
            const url = precioEditado
                ? `/api/precios-impresiones/${encodeURIComponent(precioEditado.tamanio)}/${encodeURIComponent(precioEditado.fechaDesde)}`
                : '/api/precios-impresiones';
            const response = await apiFetch(url, {
                method: precioEditado ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(
                    errorBody.message ||
                    (precioEditado ? 'No se pudo actualizar el precio.' : 'No se pudo crear el precio.'),
                );
            }

            setMensaje(precioEditado ? 'Precio actualizado. La fecha de creación se conservó.' : 'Nuevo precio creado.');
            setPrecioEditado(null);
            setFormulario(formularioVacio);
            await cargarPrecios();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar el precio.');
        } finally {
            setGuardando(false);
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
            {mensaje && <p className="printing-prices-message is-success" role="status">{mensaje}</p>}

            <form className="printing-price-form" onSubmit={handleSubmit}>
                <h3>{precioEditado ? 'Actualizar precio' : 'Crear precio'}</h3>
                {precioEditado && (
                    <p className="printing-price-created">
                        Creado el {precioEditado.fechaDesde}; esta fecha no se puede modificar.
                    </p>
                )}
                <div className="printing-price-fields">
                    <label>
                        Tamaño
                        <select
                            value={formulario.tamanio}
                            onChange={(event) => setFormulario({ ...formulario, tamanio: event.target.value })}
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
                            value={formulario.precioTamanio}
                            onChange={(event) => setFormulario({ ...formulario, precioTamanio: event.target.value })}
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
                            value={formulario.precioByN}
                            onChange={(event) => setFormulario({ ...formulario, precioByN: event.target.value })}
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
                            value={formulario.precioColor}
                            onChange={(event) => setFormulario({ ...formulario, precioColor: event.target.value })}
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
                            value={formulario.factorGanancia}
                            onChange={(event) => setFormulario({ ...formulario, factorGanancia: event.target.value })}
                            required
                        />
                    </label>
                </div>
                <div className="printing-price-actions">
                    <button className="btn-save-submit" type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : precioEditado ? 'Guardar cambios' : 'Crear precio'}
                    </button>
                    {precioEditado && (
                        <button className="btn-cancel-action" type="button" onClick={cancelarEdicion} disabled={guardando}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <div className="printing-prices-table-wrap">
                {cargando ? (
                    <p className="empty-state">Cargando precios...</p>
                ) : precios.length === 0 ? (
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
                            {precios.map((precio) => (
                                <tr key={`${precio.tamanio}-${precio.fechaDesde}`}>
                                    <td>{precio.tamanio}</td>
                                    <td>{precio.fechaDesde}</td>
                                    <td>${formatearImporte(precio.precioTamanio)}</td>
                                    <td>${formatearImporte(precio.precioByN)}</td>
                                    <td>${formatearImporte(precio.precioColor)}</td>
                                    <td>{formatearImporte(precio.factorGanancia)}</td>
                                    <td>
                                        <button
                                            className="btn-card-action btn-card-edit"
                                            type="button"
                                            onClick={() => iniciarEdicion(precio)}
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
