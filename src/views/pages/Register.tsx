import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export function Register() {
    const navigate = useNavigate();

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [contrasenia, setContrasenia] = useState('');
    const [confirmarContrasenia, setConfirmarContrasenia] = useState('');

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!nombre.trim() || !apellido.trim() || !email.trim() || !contrasenia) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        if (contrasenia.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (contrasenia !== confirmarContrasenia) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        try {
            setCargando(true);
            const respuesta = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    email: email.trim(),
                    contrasenia,
                }),
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.message || 'No se pudo completar el registro.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.usuario));

            window.dispatchEvent(new Event('authChange'));
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado al registrar la cuenta.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Crear Cuenta</h2>
                <p className="auth-subtitle">Regístrate para gestionar pedidos de imprenta</p>

                {error && (
                    <div className="auth-alert auth-alert-error">
                        <span>{error}</span>
                        <button
                            type="button"
                            className="auth-alert-close"
                            onClick={() => setError(null)}
                            aria-label="Cerrar alerta"
                        >
                            &times;
                        </button>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="reg-nombre" className="form-label">Nombre</label>
                        <input
                            id="reg-nombre"
                            type="text"
                            placeholder="Juan"
                            className="form-input"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-apellido" className="form-label">Apellido</label>
                        <input
                            id="reg-apellido"
                            type="text"
                            placeholder="Pérez"
                            className="form-input"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email" className="form-label">Correo Electrónico</label>
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password" className="form-label">Contraseña</label>
                        <input
                            id="reg-password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="form-input"
                            value={contrasenia}
                            onChange={(e) => setContrasenia(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm-password" className="form-label">Confirmar Contraseña</label>
                        <input
                            id="reg-confirm-password"
                            type="password"
                            placeholder="Repite tu contraseña"
                            className="form-input"
                            value={confirmarContrasenia}
                            onChange={(e) => setConfirmarContrasenia(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit" disabled={cargando}>
                        {cargando ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <p className="auth-footer">
                    ¿Ya tienes una cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
}
