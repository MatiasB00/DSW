import React, { useState, useEffect } from 'react';
import './Adminpedidos.css';

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

interface AdminPedidosProps {
    onCountChange?: (count: number) => void;
}

export function AdminPedidos({ onCountChange }: AdminPedidosProps) {
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

    const cargarPedidos = async () => {
        setCargandoPedidos(true);
        try {
            const response = await fetch('/api/pedidos');
            if (response.ok) {
                const data = await response.json();
                setPedidos(data);
                if (onCountChange) onCountChange(data.length);
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
        } finally {
            setCargandoPedidos(false);
        }
    };

    useEffect(() => {
        cargarPedidos();
    }, []);

    const handleCambiarEstado = async (idPedido: number, nuevoEstado: string) => {
        try {
            setActualizandoEstadoId(idPedido);
            const res = await fetch(`/api/pedidos/${idPedido}/estado`, {
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
                        <option value="en preparacion">En preparación</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
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
                                            <option value="en preparacion">En preparación</option>
                                            <option value="entregado">Entregado</option>
                                            <option value="cancelado">Cancelado</option>
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
    );
}