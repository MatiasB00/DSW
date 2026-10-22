import React, { useState, useEffect } from 'react';
import './ProductForm.css';

export interface Producto {
    IDProducto: number;
    nombre: string;
    descripcion: string;
    precio: number | string;
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
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);


    useEffect(() => {
        if (productoAEditar) {
            setNombre(productoAEditar.nombre);
            setDescripcion(productoAEditar.descripcion || '');
            setPrecio(String(productoAEditar.precio));
            setMensaje(null);
        } else {
            setNombre('');
            setDescripcion('');
            setPrecio('');
        }
    }, [productoAEditar]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje(null);
        setCargando(true);

        const esEdicion = Boolean(productoAEditar);
        const url = esEdicion ? `/api/productos/${productoAEditar!.IDProducto}` : '/api/productos';
        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    precio: Number(precio),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar la solicitud.');
            }

            setMensaje({
                tipo: 'exito',
                texto: esEdicion
                    ? '¡Producto actualizado correctamente!'
                    : '¡Producto creado correctamente en el catálogo!',
            });

            if (!esEdicion) {
                setNombre('');
                setDescripcion('');
                setPrecio('');
            }

            onGuardarExito();
        } catch (error: any) {
            setMensaje({
                tipo: 'error',
                texto: error.message || 'No se pudo conectar con el servidor.',
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="product-form-card">
            <div className="form-header">
                <h3 className="form-title">
                    {productoAEditar ? `Editar Producto #${productoAEditar.IDProducto}` : 'Crear Nuevo Producto'}
                </h3>
                {productoAEditar && (
                    <button type="button" onClick={onCancelarEdicion} className="btn-cancelar-top">
                        Cancelar edición
                    </button>
                )}
            </div>

            {mensaje && (
                <div className={`alert-box alert-${mensaje.tipo}`}>
                    {mensaje.texto}
                </div>
            )}

            <form className="admin-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="prod-nombre" className="form-label">Nombre del Producto *</label>
                    <input
                        id="prod-nombre"
                        type="text"
                        required
                        maxLength={150}
                        placeholder="Ej: Resma Papel A4 75g Chambril"
                        className="form-input"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="prod-descripcion" className="form-label">Descripción *</label>
                    <textarea
                        id="prod-descripcion"
                        required
                        rows={3}
                        placeholder="Especificaciones o detalles del producto..."
                        className="form-input form-textarea"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="prod-precio" className="form-label">Precio Unitario ($) *</label>
                    <input
                        id="prod-precio"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        className="form-input"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-admin-submit" disabled={cargando}>
                        {cargando
                            ? 'Guardando...'
                            : productoAEditar
                                ? 'Guardar Cambios'
                                : 'Crear Producto'}
                    </button>

                    {productoAEditar && (
                        <button
                            type="button"
                            className="btn-admin-cancel"
                            onClick={onCancelarEdicion}
                            disabled={cargando}
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
