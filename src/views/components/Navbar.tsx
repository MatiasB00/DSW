import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/carritoContext';
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

    const [menuAbierto, setMenuAbierto] = useState(false);

    const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const { totalItems } = useCarrito();

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
        setMenuAbierto(false);
        navigate('/');
    };

    const cerrarMenu = () => setMenuAbierto(false);

    return (
        <header className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/" className="navbar-logo" onClick={cerrarMenu}>
                        Imprenta Mayorista
                    </Link>
                </div>

                <button
                    type="button"
                    className={`hamburger-btn ${menuAbierto ? 'is-active' : ''}`}
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={menuAbierto}
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                <nav className={`navbar-nav ${menuAbierto ? 'nav-open' : ''}`}>
                    <Link to="/" className="nav-link" onClick={cerrarMenu}>
                        Inicio
                    </Link>
                    <Link to="/productos" className="nav-link" onClick={cerrarMenu}>
                        Productos
                    </Link>
                    <Link to="/nosotros" className="nav-link" onClick={cerrarMenu}>
                        Nosotros
                    </Link>
                    <Link to="/carrito" className="nav-link nav-link-cart" onClick={cerrarMenu}>
                        Carrito {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                    </Link>


                    {!usuario && (
                        <Link to="/login" className="btn-login" onClick={cerrarMenu}>
                            Iniciar Sesión
                        </Link>
                    )}

                    {usuario && (
                        <div className="navbar-user-group">
                            {usuario.rol === 'admin' ? (
                                <Link to="/admin" className="btn-login" onClick={cerrarMenu}>
                                    Panel Admin
                                </Link>
                            ) : (
                                <Link to="/perfil" className="btn-login" onClick={cerrarMenu}>
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
            </div>
        </header>
    );
}