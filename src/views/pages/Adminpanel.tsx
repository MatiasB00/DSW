import React, { useState, useEffect } from 'react';
import { ProductForm, Producto } from '../components/ProductForm';
import { ProveedoresForm, Proveedor } from '../components/ProveedoresForm';
import './Adminpanel.css';

export function Adminpanel() {
    const [pestanaActiva, setPestanaActiva] = useState<'productos' | 'proveedores'>('productos');


    const [productos, setProductos] = useState<Producto[]>([]);
    const [cargandoProductos, setCargandoProductos] = useState(true);
    const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);


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

        // Limpieza por si el usuario cambia de página de golpe
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [productoHistorial]);

    const cargarProductos = async () => {
        setCargandoProductos(true);
        try {
            const response = await fetch('/api/productos');
            if (response.ok) {
                const data = await response.json();
                setProductos(data);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setCargandoProductos(false);
        }
    };

    const cargarProveedores = async () => {
        setCargandoProveedores(true);
        try {
            const response = await fetch('/api/proveedores');
            if (response.ok) {
                const data = await response.json();
                setProveedores(data);
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        } finally {
            setCargandoProveedores(false);
        }
    };

    useEffect(() => {
        cargarProductos();
        cargarProveedores();
    }, []);

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

    const handleEliminarProveedor = async (id: number, razonSocial: string) => {
        const confirmar = window.confirm(
            `¿Estás seguro de que deseas eliminar al proveedor "${razonSocial}"?`
        );
        if (!confirmar) return;

        try {
            const response = await fetch(`/api/proveedores/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'No se pudo eliminar el proveedor. Verifica que no tenga productos asociados.'
                );
            }

            if (proveedorAEditar?.IDProveedor === id) {
                setProveedorAEditar(null);
            }

            cargarProveedores();
        } catch (error: any) {
            alert(error.message || 'Error al eliminar el proveedor.');
        }
    };

    const proveedoresFiltrados = proveedores.filter((prov) =>
        prov.razonSocial.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
        prov.cuit.includes(busquedaProveedor)
    );

    return (
        <main className="admin-container">
            <header className="admin-header">
                <h2 className="admin-title">Panel de Administración</h2>
                <p className="admin-subtitle">
                    Gestión integral de catálogo, precios y proveedores mayoristas
                </p>

                <div className="admin-tabs-bar">
                    <button
                        type="button"
                        className={`admin-tab-btn ${pestanaActiva === 'productos' ? 'active' : ''}`}
                        onClick={() => setPestanaActiva('productos')}
                    >
                        Productos ({productos.length})
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${pestanaActiva === 'proveedores' ? 'active' : ''}`}
                        onClick={() => setPestanaActiva('proveedores')}
                    >
                        Proveedores ({proveedores.length})
                    </button>
                </div>
            </header>

            {pestanaActiva === 'productos' && (
                <>
                    <ProductForm
                        productoAEditar={productoAEditar}
                        onGuardarExito={() => {
                            cargarProductos();
                            setProductoAEditar(null);
                        }}
                        onCancelarEdicion={() => setProductoAEditar(null)}
                    />

                    <section className="admin-section">
                        <div className="section-header-row">
                            <h3 className="section-title">
                                Productos en el Catálogo ({productos.length})
                            </h3>
                        </div>

                        {cargandoProductos ? (
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
                                            </div>

                                            <div className="product-item-prov">
                                                {prod.proveedorNombre || 'Proveedor no especificado'}
                                            </div>

                                            <p className="product-item-desc">
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
        </main>
    );
}
