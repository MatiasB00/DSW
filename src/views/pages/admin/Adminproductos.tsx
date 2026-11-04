import React, { useState, useEffect } from 'react';
import { ProductForm, Producto } from '../../components/ProductForm';
import { CategoriasManager } from '../../components/CategoriasManager';
import './Adminproductos.css';

interface AdminProductosProps {
    onCountChange?: (count: number) => void;
}

export function AdminProductos({ onCountChange }: AdminProductosProps) {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [cargandoProductos, setCargandoProductos] = useState(true);
    const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
    const [versionCategorias, setVersionCategorias] = useState(0);

    const [productoHistorial, setProductoHistorial] = useState<{ id: number; nombre: string } | null>(null);
    const [historialPrecios, setHistorialPrecios] = useState<Array<{ fechaDesde: string; valor: number | string }>>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

    const cargarProductos = async () => {
        setCargandoProductos(true);
        try {
            const response = await fetch('/api/productos');
            if (response.ok) {
                const data = await response.json();
                setProductos(data);
                if (onCountChange) onCountChange(data.length);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setCargandoProductos(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const refrescarCategorias = () => {
        setVersionCategorias((prev) => prev + 1);
        cargarProductos();
    };

    const handleEliminarProducto = async (id: number, nombre: string) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`);
        if (!confirmar) return;

        try {
            const response = await fetch(`/api/productos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar el producto.');
            }

            if (productoAEditar?.IDProducto === id) {
                setProductoAEditar(null);
            }

            cargarProductos();
        } catch (error: any) {
            alert(error.message || 'Error al eliminar el producto.');
        }
    };

    const handleAbrirHistorial = async (id: number, nombre: string) => {
        setProductoHistorial({ id, nombre });
        setCargandoHistorial(true);
        setErrorHistorial(null);
        try {
            const respuesta = await fetch(`/api/productos/${id}/precios`);
            if (!respuesta.ok) {
                throw new Error('No se pudo obtener el historial de precios.');
            }
            const data = await respuesta.json();
            setHistorialPrecios(data);
        } catch (err: any) {
            setErrorHistorial(err.message || 'Error al cargar el historial.');
        } finally {
            setCargandoHistorial(false);
        }
    };

    const handleCerrarHistorial = () => {
        setProductoHistorial(null);
        setHistorialPrecios([]);
        setErrorHistorial(null);
    };

    useEffect(() => {
        if (productoHistorial) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [productoHistorial]);

    return (
        <>
            <ProductForm
                productoAEditar={productoAEditar}
                versionCategorias={versionCategorias}
                onGuardarExito={() => {
                    cargarProductos();
                    setProductoAEditar(null);
                }}
                onCancelarEdicion={() => setProductoAEditar(null)}
            />

            <CategoriasManager onCategoriasChange={refrescarCategorias} />

            <section className="admin-section">
                <div className="section-header-row">
                    <h3 className="section-title">
                        Productos en el Catálogo ({productos.length})
                    </h3>
                </div>

                {cargandoProductos ? (
                    <p className="empty-state">Cargando productos de la base de datos...</p>
                ) : productos.length === 0 ? (
                    <p className="empty-state">No hay productos registrados en el catálogo aún.</p>
                ) : (
                    <div className="products-grid">
                        {productos.map((prod) => (
                            <article key={prod.IDProducto} className="product-item-card">
                                <div>
                                    <div className="product-item-header">
                                        <h4 className="product-item-name">{prod.nombre}</h4>
                                    </div>

                                    <div className="product-item-prov">
                                        {prod.categoria ? `${prod.categoria} • ` : ''}
                                        {prod.proveedorNombre || 'Proveedor no especificado'}
                                    </div>

                                    <div className="product-item-stock">
                                        <strong>Stock: {prod.stock ?? 0} u.</strong>
                                    </div>

                                    <p className="product-item-desc" title={prod.descripcion}>
                                        {prod.descripcion || 'Sin descripción.'}
                                    </p>
                                </div>

                                <div>
                                    <div className="product-item-footer">
                                        <span className="product-item-price-label">Precio Vigente</span>
                                        <span className="product-item-price">
                                            ${Number(prod.precio).toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>

                                    <div className="product-item-actions">
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-history"
                                            onClick={() => handleAbrirHistorial(prod.IDProducto, prod.nombre)}
                                        >
                                            Hist. de Precios
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-delete"
                                            onClick={() => handleEliminarProducto(prod.IDProducto, prod.nombre)}
                                        >
                                            Eliminar
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-edit btn-card-full"
                                            onClick={() => {
                                                setProductoAEditar(prod);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            Editar Producto
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {productoHistorial && (
                <div className="modal-overlay" onClick={handleCerrarHistorial}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Historial de Precios</h3>
                                <p className="modal-subtitle">{productoHistorial.nombre}</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close-icon"
                                onClick={handleCerrarHistorial}
                                aria-label="Cerrar modal"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            {cargandoHistorial ? (
                                <p className="empty-state">Cargando precios...</p>
                            ) : errorHistorial ? (
                                <p className="empty-state">{errorHistorial}</p>
                            ) : historialPrecios.length === 0 ? (
                                <p className="empty-state">No hay registros de precios para este producto.</p>
                            ) : (
                                historialPrecios.map((item, index) => {
                                    const esVigente = index === 0;
                                    const fecha = new Date(item.fechaDesde).toLocaleString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    });

                                    return (
                                        <div
                                            key={item.fechaDesde}
                                            className={`history-item ${esVigente ? 'history-item-current' : ''}`}
                                        >
                                            <div className="history-item-left">
                                                <span className="history-date">{fecha}</span>
                                            </div>
                                            <div className="history-price">
                                                ${Number(item.valor).toLocaleString('es-AR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-modal-close"
                                onClick={handleCerrarHistorial}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}