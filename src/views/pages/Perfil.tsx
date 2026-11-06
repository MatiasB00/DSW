import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiFetch';
import './Perfil.css';

interface PedidoItemDetalle {
    IDProducto: number;
    nombre: string;
    cantidad: number;
    precio: number | string;
    subtotal: number | string;
}

interface PedidoCliente {
    IDPedido: number;
    fecha: string;
    estado: string;
    total: number | string;
    tipo: 'insumo' | 'impresion';
    items?: PedidoItemDetalle[];
}

export function Perfil() {
    const location = useLocation();
    const nuevoPedidoId = location.state?.nuevoPedidoId;

    const usuarioGuardado = localStorage.getItem('user');
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [pedidoAbiertoId, setPedidoAbiertoId] = useState<number | null>(null);
    const [detallesCargados, setDetallesCargados] = useState<Record<number, PedidoItemDetalle[]>>({});
    const [cargandoDetalleId, setCargandoDetalleId] = useState<number | null>(null);
    const [alertaPedido, setAlertaPedido] = useState<number | null>(nuevoPedidoId || null);

    const normalizarClaseEstado = (estado: string) =>
        estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');

    useEffect(() => {
        if (!usuario?.IDUsuario) {
            setCargando(false);
            return;
        }

        const cargarPedidos = async () => {
            try {
                setCargando(true);
                setError(null);
                const res = await apiFetch('/api/pedidos');
                if (!res.ok) throw new Error('No se pudieron obtener los pedidos.');
                const data = await res.json();
                setPedidos(data);
            } catch (err: any) {
                setError(err.message || 'Error al cargar tus pedidos.');
            } finally {
                setCargando(false);
            }
        };

        cargarPedidos();
    }, [usuario?.IDUsuario]);

    const toggleDetallePedido = async (idPedido: number) => {
        if (pedidoAbiertoId === idPedido) {
            setPedidoAbiertoId(null);
            return;
        }

        setPedidoAbiertoId(idPedido);

        if (detallesCargados[idPedido]) return;

        try {
            setCargandoDetalleId(idPedido);
            const res = await apiFetch(`/api/pedidos/${idPedido}`);
            if (res.ok) {
                const data = await res.json();
                setDetallesCargados((prev) => ({
                    ...prev,
                    [idPedido]: data.items || [],
                }));
            }
        } catch (err) {
            console.error('Error al cargar detalle del pedido:', err);
        } finally {
            setCargandoDetalleId(null);
        }
    };

    if (!usuario) {
        return (
            <main className="perfil-container">
                <div className="perfil-card perfil-no-auth">
                    <h2>Sesión no iniciada</h2>
                    <p>Debés iniciar sesión para ver los datos de tu cuenta y tus pedidos.</p>
                    <Link to="/login" className="btn-perfil-primary">
                        Iniciar Sesión
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="perfil-container">
            {alertaPedido && (
                <div className="perfil-alert-success">
                    <span>¡Tu pedido <strong>#{alertaPedido}</strong> fue registrado con éxito en nuestro sistema!</span>
                    <button
                        type="button"
                        className="close-alert-btn"
                        onClick={() => setAlertaPedido(null)}
                        aria-label="Cerrar notificación"
                    >
                        &times;
                    </button>
                </div>
            )}

            <header className="perfil-header-card">
                <div>
                    <h1 className="perfil-titulo">{usuario.nombre} {usuario.apellido}</h1>
                    <p className="perfil-meta">
                        Email: <strong>{usuario.email}</strong>
                    </p>
                </div>
            </header>

            <section className="perfil-orders-section">
                <h2 className="perfil-orders-title">Mis Pedidos ({pedidos.length})</h2>

                {cargando ? (
                    <div className="perfil-state-box">
                        <p>Cargando tus pedidos...</p>
                    </div>
                ) : error ? (
                    <div className="perfil-state-box perfil-state-error">
                        <p>{error}</p>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="perfil-state-box">
                        <p className="perfil-empty-title">Aún no realizaste ningún pedido</p>
                        <p className="perfil-empty-desc">
                            Explorá nuestro catálogo de insumos mayoristas para comenzar.
                        </p>
                        <Link to="/productos" className="btn-perfil-primary">
                            Ir al Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="perfil-orders-list">
                        {pedidos.map((pedido) => {
                            const estaAbierto = pedidoAbiertoId === pedido.IDPedido;
                            const itemsDetalle = detallesCargados[pedido.IDPedido];
                            const estaCargandoItems = cargandoDetalleId === pedido.IDPedido;

                            return (
                                <article
                                    key={pedido.IDPedido}
                                    className="perfil-order-card"
                                >
                                    <div className="perfil-order-header">
                                        <div className="order-main-info">
                                            <span className="order-id">Pedido #{pedido.IDPedido}</span>
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

                                        <div className="order-status-block">
                                            <span className={`order-status-badge status-${normalizarClaseEstado(pedido.estado)}`}>
                                                {pedido.estado}
                                            </span>
                                            <span className="order-total-val">
                                                ${Number(pedido.total).toLocaleString('es-AR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="perfil-order-actions">
                                        <button
                                            type="button"
                                            className="btn-toggle-detail"
                                            onClick={() => toggleDetallePedido(pedido.IDPedido)}
                                        >
                                            {estaAbierto ? '▲ Ocultar Detalle' : '▼ Ver Productos Comprados'}
                                        </button>
                                    </div>

                                    {estaAbierto && (
                                        <div className="perfil-order-expanded">
                                            {estaCargandoItems ? (
                                                <p className="loading-items-text">Cargando productos del pedido...</p>
                                            ) : itemsDetalle && itemsDetalle.length > 0 ? (
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
                                                            {itemsDetalle.map((item) => (
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
