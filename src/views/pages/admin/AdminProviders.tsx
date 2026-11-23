import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import { ProvidersForm, Provider } from '../../components/ProvidersForm';
import { ConfirmModal } from '../../components/ConfirmModal';
import './AdminProviders.css';

interface AdminProvidersProps {
    onCountChange?: (count: number) => void;
}

export function AdminProviders({ onCountChange }: AdminProvidersProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [providerToEdit, setProviderToEdit] = useState<Provider | null>(null);
    const [providerToDelete, setProviderToDelete] = useState<{ id: number; name: string } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchProvider, setSearchProvider] = useState('');

    const loadProviders = async () => {
        setLoadingProviders(true);
        try {
            const response = await apiFetch('/api/proveedores');
            if (response.ok) {
                const data = await response.json();
                setProviders(data);
                if (onCountChange) onCountChange(data.length);
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        } finally {
            setLoadingProviders(false);
        }
    };

    useEffect(() => {
        loadProviders();
    }, []);

    const executeDeleteProvider = async (id: number) => {
        try {
            setErrorMessage(null);
            const response = await apiFetch(`/api/proveedores/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'No se pudo eliminar el proveedor. Verifica que no tenga productos asociados.'
                );
            }

            if (providerToEdit?.IDProveedor === id) {
                setProviderToEdit(null);
            }

            loadProviders();
        } catch (error: any) {
            setErrorMessage(error.message || 'Error al eliminar el proveedor.');
        }
    };

    const filteredProviders = providers.filter((prov) =>
        prov.razonSocial.toLowerCase().includes(searchProvider.toLowerCase()) ||
        prov.cuit.includes(searchProvider)
    );

    return (
        <>
            <ProvidersForm
                providerToEdit={providerToEdit}
                onSaveSuccess={() => {
                    loadProviders();
                    setProviderToEdit(null);
                }}
                onCancelEdit={() => setProviderToEdit(null)}
            />

            <section className="admin-section">
                <div className="section-header-row">
                    <h3 className="section-title">
                        Proveedores Registrados ({filteredProviders.length})
                    </h3>

                    <div className="search-box-container">
                        <input
                            type="text"
                            className="search-box-input"
                            placeholder="Buscar por razón social o CUIT..."
                            value={searchProvider}
                            onChange={(e) => setSearchProvider(e.target.value)}
                        />
                    </div>
                </div>

                {errorMessage && (
                    <div className="admin-feedback-alert error">
                        <span>{errorMessage}</span>
                        <button
                            type="button"
                            className="admin-feedback-close"
                            onClick={() => setErrorMessage(null)}
                            aria-label="Cerrar notificación"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {loadingProviders ? (
                    <p className="empty-state">Cargando proveedores de la base de datos...</p>
                ) : providers.length === 0 ? (
                    <p className="empty-state">
                        No hay proveedores registrados todavía.
                    </p>
                ) : filteredProviders.length === 0 ? (
                    <p className="empty-state">
                        No se encontraron proveedores que coincidan con la búsqueda.
                    </p>
                ) : (
                    <div className="suppliers-grid">
                        {filteredProviders.map((prov) => (
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
                                            setProviderToEdit(prov);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-card-action btn-card-delete"
                                        onClick={() => setProviderToDelete({ id: prov.IDProveedor, name: prov.razonSocial })}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <ConfirmModal
                isOpen={Boolean(providerToDelete)}
                title="Eliminar Proveedor"
                message={`¿Estás seguro de que deseas eliminar al proveedor "${providerToDelete?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar Proveedor"
                isDestructive={true}
                onCancel={() => setProviderToDelete(null)}
                onConfirm={async () => {
                    if (providerToDelete) {
                        await executeDeleteProvider(providerToDelete.id);
                        setProviderToDelete(null);
                    }
                }}
            />
        </>
    );
}
