import React, { useState } from 'react';
import { AdminProducts } from './admin/AdminProducts';
import { AdminProviders } from './admin/AdminProviders';
import { AdminOrders } from './admin/AdminOrders';
import { AdminPrintingPrices } from './admin/AdminPrintingPrices';
import './AdminPanel.css';

export function AdminPanel() {
    const [activeTab, setActiveTab] = useState<'products' | 'providers' | 'orders' | 'prices'>('products');
    const [counts, setCounts] = useState<{
        products?: number;
        providers?: number;
        orders?: number;
    }>({});

    const updateCount = (type: 'products' | 'providers' | 'orders', total: number) => {
        setCounts((prev) => ({ ...prev, [type]: total }));
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
                        className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Productos {counts.products !== undefined ? `(${counts.products})` : ''}
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${activeTab === 'providers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('providers')}
                    >
                        Proveedores {counts.providers !== undefined ? `(${counts.providers})` : ''}
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Pedidos {counts.orders !== undefined ? `(${counts.orders})` : ''}
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${activeTab === 'prices' ? 'active' : ''}`}
                        onClick={() => setActiveTab('prices')}
                    >
                        Precios de impresión
                    </button>
                </div>
            </header>

            {activeTab === 'products' && (
                <AdminProducts onCountChange={(c) => updateCount('products', c)} />
            )}

            {activeTab === 'providers' && (
                <AdminProviders onCountChange={(c) => updateCount('providers', c)} />
            )}

            {activeTab === 'orders' && (
                <AdminOrders onCountChange={(c) => updateCount('orders', c)} />
            )}

            {activeTab === 'prices' && <AdminPrintingPrices />}
        </main>
    );
}
