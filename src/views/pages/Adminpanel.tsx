import React, { useState, useEffect } from 'react';
import { ProductForm, Producto } from '../components/ProductForm';
import './Adminpanel.css';

export function Adminpanel() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);

<<<<<<< HEAD
=======

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargandoProveedores, setCargandoProveedores] = useState(true);
    const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);
    const [busquedaProveedor, setBusquedaProveedor] = useState('');

    const [productoHistorial, setProductoHistorial] = useState<{ id: number; nombre: string } | null>(null);
    const [historialPrecios, setHistorialPrecios] = useState<Array<{ fechaDesde: string; valor: number | string }>>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

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

>>>>>>> origin/main
    const cargarProductos = async () => {
        setCargandoLista(true);
        try {
            const response = await fetch('/api/productos');
            if (response.ok) {
                const data = await response.json();
                setProductos(data);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setCargandoLista(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const handleEliminar = async (id: number, nombre: string) => {
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

            // Si estábamos editando justo el producto que se borró, limpiamos el formulario
            if (productoAEditar?.IDProducto === id) {
                setProductoAEditar(null);
            }

            cargarProductos();
        } catch (error: any) {
            alert(error.message || 'Error al eliminar el producto.');
        }
    };

    return (
        <main className="admin-container">
            <header className="admin-header">
                <h2 className="admin-title">Panel de Administración</h2>
                <p className="admin-subtitle">
                    Gestión integral de productos e insumos mayoristas
                </p>
            </header>

            {/* Componente Modular de Formulario */}
            <section className="admin-section">
                <ProductForm
                    productoAEditar={productoAEditar}
                    onGuardarExito={cargarProductos}
                    onCancelarEdicion={() => setProductoAEditar(null)}
                />
            </section>

            {/* Catálogo de Productos con Acciones */}
            <section className="admin-section">
                <h3 className="section-title">
                    <span></span> Productos en el Catálogo ({productos.length})
                </h3>

                {cargandoLista ? (
                    <p className="empty-state">Cargando productos de la base de datos...</p>
                ) : productos.length === 0 ? (
                    <p className="empty-state">
                        No hay productos registrados en el catálogo aún.
                    </p>
                ) : (
                    <div className="products-grid">
                        {productos.map((prod) => (
                            <article key={prod.IDProducto} className="product-item-card">
                                <div>
                                    <div className="product-item-header">
                                        <h4 className="product-item-name">{prod.nombre}</h4>
                                        <span className="product-badge-id">#{prod.IDProducto}</span>
                                    </div>
                                    <p className="product-item-desc">
                                        {prod.descripcion || 'Sin descripción.'}
                                    </p>
                                </div>

                                <div>
                                    <div className="product-item-footer">
                                        <span className="product-item-price-label">Precio</span>
                                        <span className="product-item-price">
                                            ${Number(prod.precio).toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>

<<<<<<< HEAD
                                    {/* Botones de Acción */}
                                    <div className="product-item-actions">
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-edit"
                                            onClick={() => {
                                                setProductoAEditar(prod);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
=======
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
                </>
            )}

            {pestanaActiva === 'proveedores' && (
                <>
                    <ProveedoresForm
                        proveedorAEditar={proveedorAEditar}
                        onGuardarExito={() => {
                            cargarProveedores();
                            setProveedorAEditar(null);
                        }}
                        onCancelarEdicion={() => setProveedorAEditar(null)}
                    />

                    <section className="admin-section">
                        <div className="section-header-row">
                            <h3 className="section-title">
                                Proveedores Registrados ({proveedoresFiltrados.length})
                            </h3>

                            <div className="search-box-container">
                                <input
                                    type="text"
                                    className="search-box-input"
                                    placeholder="Buscar por razón social o CUIT..."
                                    value={busquedaProveedor}
                                    onChange={(e) => setBusquedaProveedor(e.target.value)}
                                />
                            </div>
                        </div>

                        {cargandoProveedores ? (
                            <p className="empty-state">Cargando proveedores de la base de datos...</p>
                        ) : proveedores.length === 0 ? (
                            <p className="empty-state">
                                No hay proveedores registrados todavía.
                            </p>
                        ) : proveedoresFiltrados.length === 0 ? (
                            <p className="empty-state">
                                No se encontraron proveedores que coincidan con la búsqueda.
                            </p>
                        ) : (
                            <div className="suppliers-grid">
                                {proveedoresFiltrados.map((prov) => (
                                    <article key={prov.IDProveedor} className="supplier-item-card">
                                        <div>
                                            <div className="supplier-item-header">
                                                <h4 className="supplier-item-name">{prov.razonSocial}</h4>
                                            </div>

                                            <ul className="supplier-info-list">
                                                <li>
                                                    <strong>Cuit:</strong> {prov.cuit}
                                                </li>
                                                <li>
                                                    <strong>Email:</strong> {prov.email}
                                                </li>
                                                <li>
                                                    <strong>Teléfono:</strong> {prov.telefono || 'No especificado'}
                                                </li>
                                                <li>
                                                    <strong>Dirección:</strong> {prov.direccion || 'No especificada'}
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="supplier-item-actions">
                                            <button
                                                type="button"
                                                className="btn-card-action btn-card-edit"
                                                onClick={() => {
                                                    setProveedorAEditar(prov);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-card-action btn-card-delete"
                                                onClick={() => handleEliminarProveedor(prov.IDProveedor, prov.razonSocial)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

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
>>>>>>> origin/main
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-delete"
                                            onClick={() => handleEliminar(prod.IDProducto, prod.nombre)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
