import React from "react";
import { Link } from 'react-router-dom';
import './Auth.css';

export function Login() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Iniciar Sesión</h2>
                <p className="auth-subtitle">Ingresa a tu cuenta de Imprenta Mayorista</p>

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="login-email"
                            placeholder="ejemplo@correo.com"
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">Contraseña</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            className="form-input"
                        />
                    </div>

                    <button type="submit" className="btn-submit">
                        Ingresar
                    </button>
                </form>

                <p className="auth-footer">
                    ¿No tienes una cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
                </p>
            </div>
        </div>
    );
}