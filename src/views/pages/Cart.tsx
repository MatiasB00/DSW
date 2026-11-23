import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cartContext';
import { apiFetch } from '../lib/apiFetch';
import './Cart.css';

export function Cart() {
    const navigate = useNavigate();

    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
    } = useCart();

    const [sending, setSending] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);

    const handleConfirmOrder = async () => {
        setOrderError(null);
        if (!localStorage.getItem('token')) {
            setOrderError('Debés iniciar sesión para confirmar tu pedido.');
            setTimeout(() => {
                navigate('/login');
            }, 1200);
            return;
        }
        if (items.length === 0) return;
        setSending(true);
        try {
            const res = await apiFetch('/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tipo: 'insumo',
                    items: items.map((item) => ({
                        IDProducto: item.IDProducto,
                        cantidad: item.cantidad,
                    })),
                }),
            });
            if (!res.ok) {
                const dataErr = await res.json().catch(() => ({}));
                throw new Error(dataErr.message || 'Error al procesar el pedido.');
            }
            const createdOrder = await res.json();
            clearCart();
            navigate('/perfil', { state: { nuevoPedidoId: createdOrder.IDPedido } });
        } catch (err: any) {
            setOrderError(err.message || 'No se pudo confirmar el pedido.');
        } finally {
            setSending(false);
        }
    };

    return (
        <main className="cart-container">
            <header className="cart-header">
                <h1 className="cart-title">Tu Carrito de Pedidos</h1>
                <p className="cart-subtitle">
                    Revisá los insumos seleccionados antes de confirmar tu pedido mayorista
                </p>
            </header>

            {items.length === 0 ? (
                <div className="cart-empty-box">
                    <h2 className="cart-empty-title">Tu carrito está vacío</h2>
                    <p className="cart-empty-desc">
                        Aún no agregaste ningún insumo. Explorá nuestro catálogo para comenzar tu pedido.
                    </p>
                    <Link to="/productos" className="btn-cart-primary">
                        Explorar Catálogo
                    </Link>
                </div>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items-list">
                        <div className="cart-items-header">
                            <span>Insumos ({totalItems})</span>
                            <button
                                type="button"
                                className="btn-clear-cart"
                                onClick={clearCart}
                            >
                                Vaciar Carrito
                            </button>
                        </div>

                        {items.map((item) => (
                            <article key={item.IDProducto} className="cart-item-card">
                                <div className="cart-item-info">
                                    <h3 className="cart-item-name">{item.nombre}</h3>
                                    <span className="cart-item-unit-price">
                                        Precio unitario: ${item.precio.toLocaleString('es-AR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                <div className="cart-item-actions">
                                    <div className="quantity-controls">
                                        <button
                                            type="button"
                                            className="btn-qty"
                                            onClick={() => updateQuantity(item.IDProducto, item.cantidad - 1)}
                                            aria-label="Disminuir cantidad"
                                        >
                                            -
                                        </button>
                                        <span className="qty-value">{item.cantidad}</span>
                                        <button
                                            type="button"
                                            className="btn-qty"
                                            onClick={() => updateQuantity(item.IDProducto, item.cantidad + 1)}
                                            aria-label="Aumentar cantidad"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="cart-item-subtotal">
                                        <span className="subtotal-label">Subtotal:</span>
                                        <span className="subtotal-val">
                                            ${(item.precio * item.cantidad).toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-remove-item"
                                        onClick={() => removeItem(item.IDProducto)}
                                        title="Eliminar del carrito"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className="cart-summary-card">
                        <h2 className="summary-title">Resumen del Pedido</h2>

                        <div className="summary-row">
                            <span>Cantidad de artículos</span>
                            <strong>{totalItems}</strong>
                        </div>

                        <div className="summary-row">
                            <span>Subtotal estimado</span>
                            <span>
                                ${totalPrice.toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row summary-total-row">
                            <span>Total</span>
                            <span className="summary-total-val">
                                ${totalPrice.toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>

                        {orderError && (
                            <p className="cart-error-message">{orderError}</p>
                        )}
                        <button
                            type="button"
                            className="btn-confirm-order"
                            onClick={handleConfirmOrder}
                            disabled={sending}
                        >
                            {sending ? 'Confirmando pedido...' : 'Confirmar Pedido'}
                        </button>

                        <Link to="/productos" className="link-continue-shopping">
                            ← Continuar comprando
                        </Link>
                    </aside>
                </div>
            )}
        </main>
    );
}
