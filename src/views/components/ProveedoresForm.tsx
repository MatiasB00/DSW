import React, { useState, useEffect } from 'react';
import './ProveedoresForm.css';

export interface Proveedor {
    IDProveedor: number;
    cuit: string;
    razonSocial: string;
    email: string;
    telefono?: string;
    direccion?: string;
}

interface ProveedoresFormProps {
    proveedorAEditar: Proveedor | null;
    onGuardarExito: () => void;
    onCancelarEdicion: () => void;
}

export function ProveedoresForm({ proveedorAEditar, onGuardarExito, onCancelarEdicion }: ProveedoresFormProps) {
    const [cuit, setCuit] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

    useEffect(() => {
        if (proveedorAEditar) {
            setCuit(proveedorAEditar.cuit);
            setRazonSocial(proveedorAEditar.razonSocial);
            setEmail(proveedorAEditar.email);
            setTelefono(proveedorAEditar.telefono || '');
            setDireccion(proveedorAEditar.direccion || '');
            setMensaje(null);
        } else {
            setCuit('');
            setRazonSocial('');
            setEmail('');
            setTelefono('');
            setDireccion('');
        }
    }, [proveedorAEditar]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje(null);
        setCargando(true);

        const esEdicion = Boolean(proveedorAEditar);
        const url = esEdicion ? `/api/proveedores/${proveedorAEditar!.IDProveedor}` : '/api/proveedores';
        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
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

            setMensaje({
                tipo: 'exito',
                texto: esEdicion ? '¡Proveedor actualizado con éxito!' : '¡Proveedor creado exitosamente!',
            });

            if (!esEdicion) {
                setCuit('');
                setRazonSocial('');
                setEmail('');
                setTelefono('');
                setDireccion('');
            }

            onGuardarExito();
        } catch (error: any) {
            setMensaje({
                tipo: 'error',
                texto: error.message || 'Ocurrió un error inesperado.',
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <article className="supplier-card-form">
            <header className="supplier-form-header">
                <h3 className="supplier-form-title">
                    {proveedorAEditar ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                </h3>
                <p className="supplier-form-subtitle">
                    {proveedorAEditar
                        ? `Modificando los datos del proveedor ${proveedorAEditar.razonSocial}`
                        : 'Completa los datos de la empresa proveedora'}
                </p>
            </header>

            {mensaje && (
                <div className={`form-feedback-alert feedback-${mensaje.tipo}`}>
                    {mensaje.texto}
                    <button className="close-alert-btn" type="button" onClick={() => setMensaje(null)} aria-label='Cerrar notificacion'>
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
                    {proveedorAEditar && (
                        <button
                            type="button"
                            className="btn-cancel-action"
                            onClick={onCancelarEdicion}
                            disabled={cargando}
                        >
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="btn-save-submit" disabled={cargando}>
                        {cargando ? 'Guardando...' : proveedorAEditar ? 'Guardar Cambios' : 'Registrar Proveedor'}
                    </button>
                </div>
            </form>
        </article>
    );
}
