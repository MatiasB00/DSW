import React, { useState } from 'react';
import { AdminProductos } from './admin/Adminproductos';
import { AdminProveedores } from './admin/Adminproveedores';
import { AdminPedidos } from './admin/Adminpedidos';
import { AdminPreciosImpresiones } from './admin/Adminpreciosimpresiones';
import './Adminpanel.css';

export function Adminpanel() {
    const [pestanaActiva, setPestanaActiva] = useState<'productos' | 'proveedores' | 'pedidos' | 'precios'>('productos');
    const [conteos, setConteos] = useState<{
        productos?: number;
        proveedores?: number;
        pedidos?: number;
    }>({});

    const actualizarConteo = (tipo: 'productos' | 'proveedores' | 'pedidos', total: number) => {
        setConteos((prev) => ({ ...prev, [tipo]: total }));
    };

    return (
        <main className="admin-container">
            <header className="admin-header">
                <h1 className="admin-title">Panel de Administración</h1>
                <p className="admin-subtitle">
                    Gestión integral de catálogo, precios, proveedores y pedidos
                </p>

                <div className="admin-tabs-bar">
                    <button
                        type="button"
                        className={`admin-tab-btn ${pestanaActiva === 'productos' ? 'active' : ''}`}
                        onClick={() => setPestanaActiva('productos')}
                    >
                        Productos {conteos.productos !== undefined ? `(${conteos.productos})` : ''}
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${pestanaActiva === 'proveedores' ? 'active' : ''}`}
                        onClick={() => setPestanaActiva('proveedores')}
                    >
                        Proveedores {conteos.proveedores !== undefined ? `(${conteos.proveedores})` : ''}
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${pestanaActiva === 'pedidos' ? 'active' : ''}`}
                        onClick={() => setPestanaActiva('pedidos')}
                    >
                        Pedidos {conteos.pedidos !== undefined ? `(${conteos.pedidos})` : ''}
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${pestanaActiva === 'precios' ? 'active' : ''}`}
                        onClick={() => setPestanaActiva('precios')}
                    >
                        Precios de impresión
                    </button>
                </div>
            </header>

            {pestanaActiva === 'productos' && (
                <AdminProductos onCountChange={(c) => actualizarConteo('productos', c)} />
            )}

            {pestanaActiva === 'proveedores' && (
                <AdminProveedores onCountChange={(c) => actualizarConteo('proveedores', c)} />
            )}

            {pestanaActiva === 'pedidos' && (
                <AdminPedidos onCountChange={(c) => actualizarConteo('pedidos', c)} />
            )}

            {pestanaActiva === 'precios' && <AdminPreciosImpresiones />}
        </main>
    );
}