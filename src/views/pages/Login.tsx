import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [contrasenia, setContrasenia] = useState('');

    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !contrasenia) {
            setError('Por favor, ingresa tu correo y contraseña.');
            return;
        }

        try {
            setCargando(true);
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    contrasenia,
                }),
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.message || 'Credenciales inválidas.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.usuario));

            window.dispatchEvent(new Event('authChange'));

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Iniciar Sesión</h2>
                <p className="auth-subtitle">Ingresa a tu cuenta de Imprenta Mayorista</p>

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
                        <label className="form-label" htmlFor="login-email">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            id="login-email"
                            placeholder="ejemplo@correo.com"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">
                            Contraseña
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            className="form-input"
                            value={contrasenia}
                            onChange={(e) => setContrasenia(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit" disabled={cargando}>
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <p className="auth-footer">
                    ¿No tienes una cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
                </p>
            </div>
        </div>
    );
}
