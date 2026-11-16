import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import './AdminOrders.css';

export interface OrderItemDetail {
    IDProducto: number;
    nombre: string;
    cantidad: number;
    precio: number | string;
    subtotal: number | string;
}

export interface AdminOrder {
    IDPedido: number;
    fecha: string;
    estado: string;
    total: number | string;
    IDUsuario: number;
    usuarioNombre?: string;
    usuarioApellido?: string;
    usuarioEmail?: string;
    tipo: 'insumo' | 'impresion';
    items?: OrderItemDetail[];
    cantCopias?: number;
    faz?: string;
    tamanio?: string;
    tipoColor?: string;
    fechaPrecioDesde?: string;
    observacion?: string | null;
    impresionSubtotal?: number | string;
}

interface AdminOrdersProps {
    onCountChange?: (count: number) => void;
}

export function AdminOrders({ onCountChange }: AdminOrdersProps) {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [searchOrder, setSearchOrder] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    const [openOrderId, setOpenOrderId] = useState<number | null>(null);
    const [loadedDetails, setLoadedDetails] = useState<Record<number, any>>({});
    const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const normalizeStatusClass = (status: string) =>
        status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');

    const loadOrders = async () => {
        setLoadingOrders(true);
        try {
            const response = await apiFetch('/api/pedidos');
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
                if (onCountChange) onCountChange(data.length);
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleChangeStatus = async (orderId: number, newStatus: string) => {
        try {
            setUpdatingStatusId(orderId);
            const res = await apiFetch(`/api/pedidos/${orderId}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newStatus }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error al actualizar el estado del pedido.');
            }

            setOrders((prev) =>
                prev.map((order) => (order.IDPedido === orderId ? { ...order, estado: newStatus } : order))
            );
            setSuccessMessage(`Estado del Pedido #${orderId} actualizado a "${newStatus}".`);
            setTimeout(() => setSuccessMessage(null), 3500);
        } catch (error: any) {
            alert(error.message || 'Error al actualizar el estado del pedido.');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const toggleOrderDetail = async (orderId: number) => {
        if (openOrderId === orderId) {
            setOpenOrderId(null);
            return;
        }

        setOpenOrderId(orderId);

        if (loadedDetails[orderId]) return;

        try {
            setLoadingDetailId(orderId);
            const res = await apiFetch(`/api/pedidos/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setLoadedDetails((prev) => ({
                    ...prev,
                    [orderId]: data,
                }));
            }
        } catch (err) {
            console.error('Error al cargar detalle del pedido:', err);
        } finally {
            setLoadingDetailId(null);
        }
    };

    const filteredOrders = orders.filter((order) => {
        const matchesStatus = statusFilter === 'todos' || order.estado.toLowerCase() === statusFilter.toLowerCase();
        const query = searchOrder.trim().toLowerCase();
        if (!query) return matchesStatus;

        const fullName = `${order.usuarioNombre || ''} ${order.usuarioApellido || ''}`.toLowerCase();
        const email = (order.usuarioEmail || '').toLowerCase();
        const id = order.IDPedido.toString();

        const matchesSearch =
            fullName.includes(query) ||
            email.includes(query) ||
            id.includes(query);

        return matchesStatus && matchesSearch;
    });

    return (
        <section className="admin-section">
            <div className="section-header-row">
                <h3 className="section-title">
                    Pedidos Registrados ({filteredOrders.length})
                </h3>

                <div className="admin-orders-filters">
                    <div className="search-box-container">
                        <input
                            type="text"
                            className="search-box-input"
                            placeholder="Buscar por ID, cliente o email..."
                            value={searchOrder}
                            onChange={(e) => setSearchOrder(e.target.value)}
                        />
                    </div>

                    <select
                        className="admin-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="en preparacion">En preparación</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            {successMessage && (
                <div className="admin-order-alert-success">
                    <span>{successMessage}</span>
                    <button
                        type="button"
                        className="close-alert-btn"
                        onClick={() => setSuccessMessage(null)}
                        aria-label="Cerrar notificación"
                    >
                        &times;
                    </button>
                </div>
            )}

            {loadingOrders ? (
                <p className="empty-state">Cargando pedidos de la base de datos...</p>
            ) : orders.length === 0 ? (
                <p className="empty-state">No se registraron pedidos en el sistema todavía.</p>
            ) : filteredOrders.length === 0 ? (
                <p className="empty-state">No se encontraron pedidos que coincidan con los filtros.</p>
            ) : (
                <div className="admin-orders-list">
                    {filteredOrders.map((order) => {
                        const isOpen = openOrderId === order.IDPedido;
                        const detail = loadedDetails[order.IDPedido];
                        const isLoadingItems = loadingDetailId === order.IDPedido;
                        const isUpdating = updatingStatusId === order.IDPedido;

                        return (
                            <article key={order.IDPedido} className="admin-order-card">
                                <div className="admin-order-header">
                                    <div className="admin-order-id-block">
                                        <div className="admin-order-id-row">
                                            <span className="order-id">Pedido #{order.IDPedido}</span>
                                            <span className="admin-order-type-badge">
                                                {order.tipo === 'impresion' ? 'Impresión' : 'Insumos'}
                                            </span>
                                        </div>
                                        <span className="order-date">
                                            {new Date(order.fecha).toLocaleDateString('es-AR', {
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
                                            {order.usuarioNombre} {order.usuarioApellido || ''}
                                        </span>
                                        <span className="admin-customer-email">{order.usuarioEmail}</span>
                                    </div>

                                    <div className="admin-order-total-block">
                                        <span className="admin-total-label">Total</span>
                                        <span className="order-total-val">
                                            ${Number(order.total).toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-order-controls-row">
                                    <div className="admin-status-control">
                                        <label
                                            htmlFor={`status-select-${order.IDPedido}`}
                                            className="admin-status-label"
                                        >
                                            Estado:
                                        </label>
                                        <select
                                            id={`status-select-${order.IDPedido}`}
                                            className={`admin-status-select status-${normalizeStatusClass(order.estado)}`}
                                            value={order.estado}
                                            disabled={isUpdating}
                                            onChange={(e) => handleChangeStatus(order.IDPedido, e.target.value)}
                                        >
                                            <option value="en preparacion">En preparación</option>
                                            <option value="entregado">Entregado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                        {isUpdating && <span className="admin-updating-text">Guardando...</span>}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-toggle-detail"
                                        onClick={() => toggleOrderDetail(order.IDPedido)}
                                    >
                                        {isOpen ? '▲ Ocultar Detalle' : '▼ Ver Productos y Detalles'}
                                    </button>
                                </div>

                                {isOpen && (
                                    <div className="admin-order-expanded">
                                        {isLoadingItems ? (
                                            <p className="loading-items-text">Cargando información del pedido...</p>
                                        ) : detail ? (
                                            <>
                                                {detail.tipo === 'insumo' && detail.items && detail.items.length > 0 ? (
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
                                                                {detail.items.map((item: OrderItemDetail) => (
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
                                                ) : detail.tipo === 'impresion' ? (
                                                    <div className="admin-print-details">
                                                        <div className="admin-print-row">
                                                            <span><strong>Copias:</strong> {detail.cantCopias}</span>
                                                            <span><strong>Faz:</strong> {detail.faz}</span>
                                                            <span><strong>Tamaño:</strong> {detail.tamanio}</span>
                                                            <span><strong>Impresión:</strong> {detail.tipoColor}</span>
                                                        </div>
                                                        {detail.fechaPrecioDesde && (
                                                            <div className="admin-print-obs">
                                                                <strong>Precio aplicado desde:</strong> {detail.fechaPrecioDesde}
                                                            </div>
                                                        )}
                                                        {detail.observacion && (
                                                            <div className="admin-print-obs">
                                                                <strong>Observaciones:</strong> {detail.observacion}
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
