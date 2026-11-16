import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiFetch';
import './ProvidersForm.css';

export interface Provider {
    IDProveedor: number;
    cuit: string;
    razonSocial: string;
    email: string;
    telefono?: string;
    direccion?: string;
}

interface ProvidersFormProps {
    providerToEdit: Provider | null;
    onSaveSuccess: () => void;
    onCancelEdit: () => void;
}

export function ProvidersForm({ providerToEdit, onSaveSuccess, onCancelEdit }: ProvidersFormProps) {
    const [cuit, setCuit] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (providerToEdit) {
            setCuit(providerToEdit.cuit);
            setRazonSocial(providerToEdit.razonSocial);
            setEmail(providerToEdit.email);
            setTelefono(providerToEdit.telefono || '');
            setDireccion(providerToEdit.direccion || '');
            setMessage(null);
        } else {
            setCuit('');
            setRazonSocial('');
            setEmail('');
            setTelefono('');
            setDireccion('');
        }
    }, [providerToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const isEditing = Boolean(providerToEdit);
        const url = isEditing ? `/api/proveedores/${providerToEdit!.IDProveedor}` : '/api/proveedores';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cuit: cuit.trim(),
                    razonSocial: razonSocial.trim(),
                    email: email.trim(),
                    telefono: telefono.trim() || null,
                    direccion: direccion.trim() || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar la solicitud.');
            }

            setMessage({
                type: 'success',
                text: isEditing ? '¡Proveedor actualizado con éxito!' : '¡Proveedor creado exitosamente!',
            });

            if (!isEditing) {
                setCuit('');
                setRazonSocial('');
                setEmail('');
                setTelefono('');
                setDireccion('');
            }

            onSaveSuccess();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Ocurrió un error inesperado.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <article className="supplier-card-form">
            <header className="supplier-form-header">
                <h3 className="supplier-form-title">
                    {providerToEdit ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                </h3>
                <p className="supplier-form-subtitle">
                    {providerToEdit
                        ? `Modificando los datos del proveedor ${providerToEdit.razonSocial}`
                        : 'Completa los datos de la empresa proveedora'}
                </p>
            </header>

            {message && (
                <div className={`form-feedback-alert feedback-${message.type}`}>
                    {message.text}
                    <button className="close-alert-btn" type="button" onClick={() => setMessage(null)} aria-label='Cerrar notificacion'>
                        X
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="supplier-form-grid">
                <div className="form-group-item">
                    <label htmlFor="prov-cuit" className="field-label">CUIT *</label>
                    <input
                        id="prov-cuit"
                        type="text"
                        className="field-control"
                        placeholder="30-12345678-9"
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-item">
                    <label htmlFor="prov-razon" className="field-label">Razón Social *</label>
                    <input
                        id="prov-razon"
                        type="text"
                        className="field-control"
                        placeholder="Papelera Ejemplo SA"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-item">
                    <label htmlFor="prov-email" className="field-label">Correo Electrónico *</label>
                    <input
                        id="prov-email"
                        type="email"
                        className="field-control"
                        placeholder="ventas@papelera.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-item">
                    <label htmlFor="prov-tel" className="field-label">Teléfono</label>
                    <input
                        id="prov-tel"
                        type="text"
                        className="field-control"
                        placeholder="11 4455-6677"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                    />
                </div>

                <div className="form-group-item full-width">
                    <label htmlFor="prov-dir" className="field-label">Dirección</label>
                    <input
                        id="prov-dir"
                        type="text"
                        className="field-control"
                        placeholder="Av. Ejemplo 123"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                    />
                </div>

                <div className="form-actions-bar full-width">
                    {providerToEdit && (
                        <button
                            type="button"
                            className="btn-cancel-action"
                            onClick={onCancelEdit}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="btn-save-submit" disabled={loading}>
                        {loading ? 'Guardando...' : providerToEdit ? 'Guardar Cambios' : 'Registrar Proveedor'}
                    </button>
                </div>
            </form>
        </article>
    );
}
