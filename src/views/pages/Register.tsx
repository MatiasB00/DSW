import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export function Register() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: firstName.trim(),
                    apellido: lastName.trim(),
                    email: email.trim(),
                    contrasenia: password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'No se pudo completar el registro.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.usuario));

            window.dispatchEvent(new Event('authChange'));
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado al registrar la cuenta.');
        } finally {
            setLoading(false);
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
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
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
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm" className="form-label">Confirmar Contraseña</label>
                        <input
                            id="reg-confirm"
                            type="password"
                            placeholder="Repite tu contraseña"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="auth-link">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
