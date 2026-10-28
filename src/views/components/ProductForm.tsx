import React, { useState, useEffect } from 'react';
import './ProductForm.css';

export interface Producto {
    IDProducto: number;
    nombre: string;
    descripcion: string;
    precio: number | string;
    IDProveedor?: number;
    proveedorNombre?: string;
}

interface ProductFormProps {
    productoAEditar: Producto | null;
    onGuardarExito: () => void;
    onCancelarEdicion: () => void;
}

export function ProductForm({ productoAEditar, onGuardarExito, onCancelarEdicion }: ProductFormProps) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [idProveedor, setIdProveedor] = useState<number | ''>('');
    const [proveedores, setProveedores] = useState<Array<{ IDProveedor: number; razonSocial: string }>>([]);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

    useEffect(() => {
        fetch('/api/proveedores')
            .then((res) => res.json())
            .then((data) => setProveedores(data))
            .catch((err) => console.error('Error al cargar proveedores:', err));
    }, []);

    useEffect(() => {
        if (productoAEditar) {
            setNombre(productoAEditar.nombre);
            setDescripcion(productoAEditar.descripcion || '');
            setPrecio(String(productoAEditar.precio));
            setIdProveedor(productoAEditar.IDProveedor || '');
            setMensaje(null);
        } else {
            setNombre('');
            setDescripcion('');
            setPrecio('');
            setIdProveedor('');
        }
    }, [productoAEditar]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje(null);

        if (!idProveedor) {
            setMensaje({ tipo: 'error', texto: 'Debes seleccionar un proveedor para el producto.' });
            return;
        }

        setCargando(true);
        const esEdicion = Boolean(productoAEditar);

        try {
            if (esEdicion) {
                const resProd = await fetch(`/api/productos/${productoAEditar!.IDProducto}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre.trim(),
                        descripcion: descripcion.trim(),
                        IDProveedor: Number(idProveedor),
                    }),
                });
                if (!resProd.ok) throw new Error('No se pudo actualizar el producto.');

                if (Number(precio) !== Number(productoAEditar!.precio)) {
                    await fetch(`/api/productos/${productoAEditar!.IDProducto}/precios`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ valor: Number(precio) }),
                    });
                }

                setMensaje({ tipo: 'exito', texto: '¡Producto y precio actualizados con éxito!' });
            } else {
                const resProd = await fetch('/api/productos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre.trim(),
                        descripcion: descripcion.trim(),
                        IDProveedor: Number(idProveedor),
                    }),
                });
                if (!resProd.ok) throw new Error('Error al crear el producto.');
                const dataProd = await resProd.json();

                await fetch(`/api/productos/${dataProd.id}/precios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ valor: Number(precio) }),
                });

                setMensaje({ tipo: 'exito', texto: '¡Producto y precio inicial creados con éxito!' });
                setNombre('');
                setDescripcion('');
                setPrecio('');
                setIdProveedor('');
            }

            onGuardarExito();
        } catch (error: any) {
            setMensaje({ tipo: 'error', texto: error.message || 'Error al procesar la solicitud.' });
        } finally {
            setCargando(false);
        }
    };

    return (
        <article className="product-form-card">
            <header className="product-form-header">
                <h3 className="product-form-title">
                    {productoAEditar ? `Editar Producto #${productoAEditar.IDProducto}` : '`Reg`istrar Nuevo Producto'}
                </h3>
                <p className="product-form-subtitle">
                    {productoAEditar
                        ? 'Modifica los datos del producto o actualiza su precio de cotización'
                        : 'Ingresa los datos del insumo o producto y su proveedor'}
                </p>
            </header>

            {mensaje && (
                <div className={`form-feedback-alert feedback-${mensaje.tipo}`}>
                    {mensaje.texto}
                    <button className="close-alert-btn" type="button" onClick={() => setMensaje(null)} aria-label='Cerrar notificacion'>
                        X
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="product-form-grid">
                <div className="form-group-item full-width">
                    <label htmlFor="prod-nombre" className="field-label">Nombre del Producto *</label>
                    <input
                        id="prod-nombre"
                        type="text"
                        className="field-control"
                        placeholder="Ej: Resma Papel A4 75g Chambril"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-item">
                    <label htmlFor="prod-proveedor" className="field-label">Proveedor *</label>
                    <select
                        id="prod-proveedor"
                        className="field-control"
                        value={idProveedor}
                        onChange={(e) => setIdProveedor(e.target.value ? Number(e.target.value) : '')}
                        required
                    >
                        <option value="">-- Seleccionar Proveedor --</option>
                        {proveedores.map((prov) => (
                            <option key={prov.IDProveedor} value={prov.IDProveedor}>
                                {prov.razonSocial}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group-item">
                    <label htmlFor="prod-precio" className="field-label">Precio Vigente ($) *</label>
                    <input
                        id="prod-precio"
                        type="number"
                        step="0.01"
                        min="0"
                        className="field-control"
                        placeholder="Ej: 12500.00"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-item full-width">
                    <label htmlFor="prod-desc" className="field-label">Descripción</label>
                    <textarea
                        id="prod-desc"
                        rows={3}
                        className="field-control field-textarea"
                        placeholder="Especificaciones técnicas, gramaje, terminación..."
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                    />
                </div>

                <div className="form-actions-bar full-width">
                    {productoAEditar && (
                        <button
                            type="button"
                            className="btn-cancel-action"
                            onClick={onCancelarEdicion}
                            disabled={cargando}
                        >
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="btn-save-submit" disabled={cargando}>
                        {cargando ? 'Guardando...' : productoAEditar ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </form>
        </article>
    );
}
