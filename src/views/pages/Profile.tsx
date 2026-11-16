import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiFetch';
import './Profile.css';

interface OrderItemDetail {
    IDProducto: number;
    nombre: string;
    cantidad: number;
    precio: number | string;
    subtotal: number | string;
}

interface CustomerOrder {
    IDPedido: number;
    fecha: string;
    estado: string;
    total: number | string;
    tipo: 'insumo' | 'impresion';
    items?: OrderItemDetail[];
}

interface OrderDetail {
    tipo: 'insumo' | 'impresion';
    items?: OrderItemDetail[];
    cantCopias?: number;
    faz?: string;
    tamanio?: string;
    tipoColor?: string;
    fechaPrecioDesde?: string;
    impresionSubtotal?: number | string;
    observacion?: string | null;
}

export function Profile() {
    const location = useLocation();
    const newOrderId = location.state?.nuevoPedidoId;

    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openOrderId, setOpenOrderId] = useState<number | null>(null);
    const [loadedDetails, setLoadedDetails] = useState<Record<number, OrderDetail>>({});
    const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
    const [orderAlert, setOrderAlert] = useState<number | null>(newOrderId || null);

    const normalizeStatusClass = (status: string) =>
        status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');

    useEffect(() => {
        if (!user?.IDUsuario) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await apiFetch('/api/pedidos');
                if (!res.ok) throw new Error('No se pudieron obtener los pedidos.');
                const data = await res.json();
                setOrders(data);
            } catch (err: any) {
                setError(err.message || 'Error al cargar tus pedidos.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user?.IDUsuario]);

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

    if (!user) {
        return (
            <main className="profile-container">
                <div className="profile-card profile-no-auth">
                    <h2>Sesión no iniciada</h2>
                    <p>Debés iniciar sesión para ver los datos de tu cuenta y tus pedidos.</p>
                    <Link to="/login" className="btn-profile-primary">
                        Iniciar Sesión
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-container">
            {orderAlert && (
                <div className="profile-alert-success">
                    <span>¡Tu pedido <strong>#{orderAlert}</strong> fue registrado con éxito en nuestro sistema!</span>
                    <button
                        type="button"
                        className="close-alert-btn"
                        onClick={() => setOrderAlert(null)}
                        aria-label="Cerrar notificación"
                    >
                        &times;
                    </button>
                </div>
            )}

            <header className="profile-header-card">
                <div>
                    <h1 className="profile-title">{user.nombre} {user.apellido}</h1>
                    <p className="profile-meta">
                        Email: <strong>{user.email}</strong>
                    </p>
                </div>
            </header>

            <section className="profile-orders-section">
                <h2 className="profile-orders-title">Mis Pedidos ({orders.length})</h2>

                {loading ? (
                    <div className="profile-state-box">
                        <p>Cargando tus pedidos...</p>
                    </div>
                ) : error ? (
                    <div className="profile-state-box profile-state-error">
                        <p>{error}</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="profile-state-box">
                        <p className="profile-empty-title">Aún no realizaste ningún pedido</p>
                        <p className="profile-empty-desc">
                            Explorá nuestro catálogo de insumos mayoristas para comenzar.
                        </p>
                        <Link to="/productos" className="btn-profile-primary">
                            Ir al Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="profile-orders-list">
                        {orders.map((order) => {
                            const isOpen = openOrderId === order.IDPedido;
                            const orderDetail = loadedDetails[order.IDPedido];
                            const detailItems = orderDetail?.items;
                            const isLoadingItems = loadingDetailId === order.IDPedido;

                            return (
                                <article
                                    key={order.IDPedido}
                                    className="profile-order-card"
                                >
                                    <div className="profile-order-header">
                                        <div className="order-main-info">
                                            <span className="order-id">Pedido #{order.IDPedido}</span>
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

                                        <div className="order-status-block">
                                            <span className={`order-status-badge status-${normalizeStatusClass(order.estado)}`}>
                                                {order.estado}
                                            </span>
                                            <span className="order-total-val">
                                                ${Number(order.total).toLocaleString('es-AR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="profile-order-actions">
                                        <button
                                            type="button"
                                            className="btn-toggle-detail"
                                            onClick={() => toggleOrderDetail(order.IDPedido)}
                                        >
                                            {isOpen ? '▲ Ocultar Detalle' : '▼ Ver Productos Comprados'}
                                        </button>
                                    </div>

                                    {isOpen && (
                                        <div className="profile-order-expanded">
                                            {isLoadingItems ? (
                                                <p className="loading-items-text">Cargando productos del pedido...</p>
                                            ) : orderDetail?.tipo === 'impresion' ? (
                                                <div className="profile-print-details">
                                                    <p><strong>Tamaño:</strong> {orderDetail.tamanio}</p>
                                                    <p><strong>Impresión:</strong> {orderDetail.tipoColor}</p>
                                                    <p><strong>Faz:</strong> {orderDetail.faz}</p>
                                                    <p><strong>Copias:</strong> {orderDetail.cantCopias}</p>
                                                    <p>
                                                        <strong>Subtotal:</strong>{' '}
                                                        ${Number(orderDetail.impresionSubtotal).toLocaleString('es-AR', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                    {orderDetail.observacion && (
                                                        <p><strong>Observación:</strong> {orderDetail.observacion}</p>
                                                    )}
                                                </div>
                                            ) : detailItems && detailItems.length > 0 ? (
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
                                                            {detailItems.map((item) => (
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
                                            ) : (
                                                <p className="no-items-text">No se registraron productos para este pedido.</p>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
