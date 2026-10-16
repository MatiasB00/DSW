import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

export function Register() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Crear Cuenta</h2>
                <p className="auth-subtitle">Regístrate para gestionar pedidos de imprenta</p>

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label htmlFor="reg-nombre" className="form-label">Nombre</label>
                        <input
                            id="reg-nombre"
                            type="text"
                            placeholder="Juan"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-apellido" className="form-label">Apellido</label>
                        <input
                            id="reg-apellido"
                            type="text"
                            placeholder="Pérez"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email" className="form-label">Correo Electrónico</label>
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password" className="form-label">Contraseña</label>
                        <input
                            id="reg-password"
                            type="password"
                            placeholder="••••••••"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm-password" className="form-label">Confirmar Contraseña</label>
                        <input
                            id="reg-confirm-password"
                            type="password"
                            placeholder="••••••••"
                            className="form-input"
                        />
                    </div>

                    <button type="submit" className="btn-submit">
                        Registrarse
                    </button>
                </form>

                <p className="auth-footer">
                    ¿Ya tienes una cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
}
