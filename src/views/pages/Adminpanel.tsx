import React, { useState, useEffect } from 'react';
import { ProductForm, Producto } from '../components/ProductForm';
import { ProveedoresForm, Proveedor } from '../components/ProveedoresForm';
import { CategoriasManager } from '../components/CategoriasManager';
import './Adminpanel.css';

interface PedidoItemDetalle {
    IDProducto: number;
    nombre: string;
    cantidad: number;
    precio: number | string;
    subtotal: number | string;
}

interface PedidoAdmin {
    IDPedido: number;
    fecha: string;
    estado: string;
    total: number | string;
    IDUsuario: number;
    usuarioNombre?: string;
    usuarioApellido?: string;
    usuarioEmail?: string;
    tipo: 'insumo' | 'impresion';
    items?: PedidoItemDetalle[];
    cantCopias?: number;
    faz?: string;
    tamanio?: string;
    archivo?: string | null;
    observacion?: string | null;
    impresionSubtotal?: number | string;
}

export function Adminpanel() {
    const [pestanaActiva, setPestanaActiva] = useState<'productos' | 'proveedores' | 'pedidos'>('productos');

    const [productos, setProductos] = useState<Producto[]>([]);
    const [cargandoProductos, setCargandoProductos] = useState(true);
    const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
    const [versionCategorias, setVersionCategorias] = useState(0);
    const refrescarCategorias = () => {
        setVersionCategorias((prev) => prev + 1);
        cargarProductos();
    };

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargandoProveedores, setCargandoProveedores] = useState(true);
    const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);
    const [busquedaProveedor, setBusquedaProveedor] = useState('');

    const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
    const [cargandoPedidos, setCargandoPedidos] = useState(true);
    const [busquedaPedido, setBusquedaPedido] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [pedidoAbiertoId, setPedidoAbiertoId] = useState<number | null>(null);
    const [detallesCargados, setDetallesCargados] = useState<Record<number, any>>({});
    const [cargandoDetalleId, setCargandoDetalleId] = useState<number | null>(null);
    const [actualizandoEstadoId, setActualizandoEstadoId] = useState<number | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);

    const normalizarClaseEstado = (estado: string) =>
        estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');

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

    const cargarPedidos = async () => {
        setCargandoPedidos(true);
        try {
            const response = await fetch('/api/pedidos');
            if (response.ok) {
                const data = await response.json();
                setPedidos(data);
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
        } finally {
            setCargandoPedidos(false);
        }
    };

    useEffect(() => {
        cargarProductos();
        cargarProveedores();
        cargarPedidos();
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

    const handleCambiarEstado = async (idPedido: number, nuevoEstado: string) => {
        try {
            setActualizandoEstadoId(idPedido);
            const res = await fetch(`/api/pedidos/${idPedido}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error al actualizar el estado del pedido.');
            }

            setPedidos((prev) =>
                prev.map((p) => (p.IDPedido === idPedido ? { ...p, estado: nuevoEstado } : p))
            );
            setMensajeExito(`Estado del Pedido #${idPedido} actualizado a "${nuevoEstado}".`);
            setTimeout(() => setMensajeExito(null), 3500);
        } catch (error: any) {
            alert(error.message || 'Error al actualizar el estado del pedido.');
        } finally {
            setActualizandoEstadoId(null);
        }
    };

    const toggleDetallePedido = async (idPedido: number) => {
        if (pedidoAbiertoId === idPedido) {
            setPedidoAbiertoId(null);
            return;
        }

        setPedidoAbiertoId(idPedido);

        if (detallesCargados[idPedido]) return;

        try {
            setCargandoDetalleId(idPedido);
            const res = await fetch(`/api/pedidos/${idPedido}`);
            if (res.ok) {
                const data = await res.json();
                setDetallesCargados((prev) => ({
                    ...prev,
                    [idPedido]: data,
                }));
            }
        } catch (err) {
            console.error('Error al cargar detalle del pedido:', err);
        } finally {
            setCargandoDetalleId(null);
        }
    };

    const proveedoresFiltrados = proveedores.filter((prov) =>
        prov.razonSocial.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
        prov.cuit.includes(busquedaProveedor)
    );

    const pedidosFiltrados = pedidos.filter((ped) => {
        const coincideEstado = filtroEstado === 'todos' || ped.estado.toLowerCase() === filtroEstado.toLowerCase();
        const query = busquedaPedido.trim().toLowerCase();
        if (!query) return coincideEstado;

        const nombreCompleto = `${ped.usuarioNombre || ''} ${ped.usuarioApellido || ''}`.toLowerCase();
        const email = (ped.usuarioEmail || '').toLowerCase();
        const id = ped.IDPedido.toString();

        const coincideBusqueda =
            nombreCompleto.includes(query) ||
            email.includes(query) ||
            id.includes(query);

        return coincideEstado && coincideBusqueda;
    });

    return (
        <main className="admin-container">
            <header className="admin-header">
                <h2 className="admin-title">Panel de Administración</h2>
                <p className="admin-subtitle">
                    Gestión integral de catálogo, precios, proveedores y pedidos
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
                    <button
                        type="button"
                        className={`admin-tab-btn ${pestanaActiva === 'pedidos' ? 'active' : ''}`}
                        onClick={() => setPestanaActiva('pedidos')}
                    >
                        Pedidos ({pedidos.length})
                    </button>
                </div>
            </header>

            {pestanaActiva === 'productos' && (
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

                    <CategoriasManager
                        onCategoriasChange={refrescarCategorias}
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
                                                {prod.categoria ? `${prod.categoria} • ` : ''}{prod.proveedorNombre || 'Proveedor no especificado'}
                                            </div>

                                            <div className="product-item-stock">
                                                <strong> Stock: {prod.stock ?? 0} u.</strong>
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

            {pestanaActiva === 'pedidos' && (
                <section className="admin-section">
                    <div className="section-header-row">
                        <h3 className="section-title">
                            Pedidos Registrados ({pedidosFiltrados.length})
                        </h3>

                        <div className="admin-orders-filters">
                            <div className="search-box-container">
                                <input
                                    type="text"
                                    className="search-box-input"
                                    placeholder="Buscar por ID, cliente o email..."
                                    value={busquedaPedido}
                                    onChange={(e) => setBusquedaPedido(e.target.value)}
                                />
                            </div>

                            <select
                                className="admin-filter-select"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="En preparación">En preparación</option>
                                <option value="Enviado">Enviado</option>
                                <option value="Recibido">Recibido</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    {mensajeExito && (
                        <div className="admin-order-alert-success">
                            <span>{mensajeExito}</span>
                            <button
                                type="button"
                                className="close-alert-btn"
                                onClick={() => setMensajeExito(null)}
                                aria-label="Cerrar notificación"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {cargandoPedidos ? (
                        <p className="empty-state">Cargando pedidos de la base de datos...</p>
                    ) : pedidos.length === 0 ? (
                        <p className="empty-state">No se registraron pedidos en el sistema todavía.</p>
                    ) : pedidosFiltrados.length === 0 ? (
                        <p className="empty-state">No se encontraron pedidos que coincidan con los filtros.</p>
                    ) : (
                        <div className="admin-orders-list">
                            {pedidosFiltrados.map((pedido) => {
                                const estaAbierto = pedidoAbiertoId === pedido.IDPedido;
                                const detalle = detallesCargados[pedido.IDPedido];
                                const estaCargandoItems = cargandoDetalleId === pedido.IDPedido;
                                const estaActualizando = actualizandoEstadoId === pedido.IDPedido;

                                return (
                                    <article key={pedido.IDPedido} className="admin-order-card">
                                        <div className="admin-order-header">
                                            <div className="admin-order-id-block">
                                                <div className="admin-order-id-row">
                                                    <span className="order-id">Pedido #{pedido.IDPedido}</span>
                                                    <span className="admin-order-type-badge">
                                                        {pedido.tipo === 'impresion' ? 'Impresión' : 'Insumos'}
                                                    </span>
                                                </div>
                                                <span className="order-date">
                                                    {new Date(pedido.fecha).toLocaleDateString('es-AR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>

                                            <div className="admin-order-customer-info">
                                                <span className="admin-customer-name">
                                                    {pedido.usuarioNombre} {pedido.usuarioApellido || ''}
                                                </span>
                                                <span className="admin-customer-email">{pedido.usuarioEmail}</span>
                                            </div>

                                            <div className="admin-order-total-block">
                                                <span className="admin-total-label">Total</span>
                                                <span className="order-total-val">
                                                    ${Number(pedido.total).toLocaleString('es-AR', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="admin-order-controls-row">
                                            <div className="admin-status-control">
                                                <label
                                                    htmlFor={`status-select-${pedido.IDPedido}`}
                                                    className="admin-status-label"
                                                >
                                                    Estado:
                                                </label>
                                                <select
                                                    id={`status-select-${pedido.IDPedido}`}
                                                    className={`admin-status-select status-${normalizarClaseEstado(pedido.estado)}`}
                                                    value={pedido.estado}
                                                    disabled={estaActualizando}
                                                    onChange={(e) => handleCambiarEstado(pedido.IDPedido, e.target.value)}
                                                >
                                                    {pedido.tipo === 'insumo' ? (
                                                        <>
                                                            <option value="En preparación">En preparación</option>
                                                            <option value="Enviado">Enviado</option>
                                                            <option value="Recibido">Recibido</option>
                                                            {!['En preparación', 'Enviado', 'Recibido'].includes(pedido.estado) && (
                                                                <option value={pedido.estado}>{pedido.estado}</option>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="Pendiente">Pendiente</option>
                                                            <option value="En preparación">En preparación</option>
                                                            <option value="Completado">Completado</option>
                                                            <option value="Cancelado">Cancelado</option>
                                                            {!['Pendiente', 'En preparación', 'Completado', 'Cancelado'].includes(pedido.estado) && (
                                                                <option value={pedido.estado}>{pedido.estado}</option>
                                                            )}
                                                        </>
                                                    )}
                                                </select>
                                                {estaActualizando && <span className="admin-updating-text">Guardando...</span>}
                                            </div>

                                            <button
                                                type="button"
                                                className="btn-toggle-detail"
                                                onClick={() => toggleDetallePedido(pedido.IDPedido)}
                                            >
                                                {estaAbierto ? '▲ Ocultar Detalle' : '▼ Ver Productos y Detalles'}
                                            </button>
                                        </div>

                                        {estaAbierto && (
                                            <div className="perfil-order-expanded">
                                                {estaCargandoItems ? (
                                                    <p className="loading-items-text">Cargando información del pedido...</p>
                                                ) : detalle ? (
                                                    <>
                                                        {detalle.tipo === 'insumo' && detalle.items && detalle.items.length > 0 ? (
                                                            <div className="order-items-table-wrapper">
                                                                <table className="order-items-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Insumo</th>
                                                                            <th className="th-center">Cantidad</th>
                                                                            <th className="th-right">Precio Unitario</th>
                                                                            <th className="th-right">Subtotal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {detalle.items.map((item: PedidoItemDetalle) => (
                                                                            <tr key={item.IDProducto}>
                                                                                <td className="item-name-cell">{item.nombre}</td>
                                                                                <td className="td-center">{item.cantidad} u.</td>
                                                                                <td className="td-right">
                                                                                    ${Number(item.precio).toLocaleString('es-AR', {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2,
                                                                                    })}
                                                                                </td>
                                                                                <td className="td-right td-subtotal">
                                                                                    ${Number(item.subtotal).toLocaleString('es-AR', {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2,
                                                                                    })}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : detalle.tipo === 'impresion' ? (
                                                            <div className="admin-print-details">
                                                                <div className="admin-print-row">
                                                                    <span><strong>Copias:</strong> {detalle.cantCopias}</span>
                                                                    <span><strong>Faz:</strong> {detalle.faz}</span>
                                                                    <span><strong>Tamaño:</strong> {detalle.tamanio}</span>
                                                                </div>
                                                                {detalle.observacion && (
                                                                    <div className="admin-print-obs">
                                                                        <strong>Observaciones:</strong> {detalle.observacion}
                                                                    </div>
                                                                )}
                                                                {detalle.archivo && (
                                                                    <div className="admin-print-file">
                                                                        <strong>Archivo:</strong> {detalle.archivo}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="no-items-text">No se registraron productos para este pedido.</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="no-items-text">No se pudieron cargar los detalles del pedido.</p>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
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
