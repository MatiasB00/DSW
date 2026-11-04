import React, { useState, useEffect } from 'react';
import { ProveedoresForm, Proveedor } from '../../components/ProveedoresForm';
import './Adminproveedores.css';

interface AdminProveedoresProps {
    onCountChange?: (count: number) => void;
}

export function AdminProveedores({ onCountChange }: AdminProveedoresProps) {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargandoProveedores, setCargandoProveedores] = useState(true);
    const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);
    const [busquedaProveedor, setBusquedaProveedor] = useState('');

    const cargarProveedores = async () => {
        setCargandoProveedores(true);
        try {
            const response = await fetch('/api/proveedores');
            if (response.ok) {
                const data = await response.json();
                setProveedores(data);
                if (onCountChange) onCountChange(data.length);
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        } finally {
            setCargandoProveedores(false);
        }
    };

    useEffect(() => {
        cargarProveedores();
    }, []);

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
    );
}