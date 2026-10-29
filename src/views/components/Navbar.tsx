import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

interface UsuarioSesion {
    IDUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
}

export function Navbar() {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        const sincronizarAuth = () => {
            const stored = localStorage.getItem('user');
            setUsuario(stored ? JSON.parse(stored) : null);
        };

        window.addEventListener('authChange', sincronizarAuth);
        window.addEventListener('storage', sincronizarAuth);

        return () => {
            window.removeEventListener('authChange', sincronizarAuth);
            window.removeEventListener('storage', sincronizarAuth);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUsuario(null);
        window.dispatchEvent(new Event('authChange'));
        navigate('/');
    };

    return (
        <header className="navbar">
            <div className="navbar-brand">
                <Link to="/" className="navbar-logo">
                    Imprenta Mayorista
                </Link>
            </div>

            <nav className="navbar-nav">
                <Link to="/" className="nav-link">Inicio</Link>
                <Link to="/productos" className="nav-link">Productos</Link>
                <Link to="/nosotros" className="nav-link">Nosotros</Link>

                {!usuario && (
                    <Link to="/login" className="btn-login">
                        Iniciar Sesión
                    </Link>
                )}

                {usuario && (
                    <div className="navbar-user-group">
                        {usuario.rol === 'admin' ? (
                            <Link to="/admin" className="btn-login">
                                Panel Admin
                            </Link>
                        ) : (
                            <Link to="/perfil" className="btn-login">
                                Mi Perfil
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="btn-logout"
                            title="Cerrar Sesión"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </nav>
        </header>
    );
}
