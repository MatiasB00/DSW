import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cartContext';
import { apiFetch } from '../lib/apiFetch';
import './Navbar.css';

interface UserSession {
    IDUsuario: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
}

export function Navbar() {
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const [user, setUser] = useState<UserSession | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const { totalItems } = useCart();

    useEffect(() => {
        const syncAuth = async () => {
            if (!localStorage.getItem('token')) {
                setUser(null);
                return;
            }

            try {
                const response = await apiFetch('/api/auth/me');
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    return;
                }
                if (!response.ok) {
                    throw new Error('No se pudo verificar la sesión.');
                }
                const currentUser = await response.json();
                localStorage.setItem('user', JSON.stringify(currentUser));
                setUser(currentUser);
            } catch (error) {
                console.error('Error al verificar la sesión:', error);
            }
        };

        void syncAuth();
        window.addEventListener('authChange', syncAuth);
        window.addEventListener('storage', syncAuth);

        return () => {
            window.removeEventListener('authChange', syncAuth);
            window.removeEventListener('storage', syncAuth);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.dispatchEvent(new Event('authChange'));
        setMenuOpen(false);
        navigate('/');
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/" className="navbar-logo" onClick={closeMenu}>
                        Imprenta Mayorista
                    </Link>
                </div>

                <button
                    type="button"
                    className={`hamburger-btn ${menuOpen ? 'is-active' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={menuOpen}
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                <nav className={`navbar-nav ${menuOpen ? 'nav-open' : ''}`}>
                    <Link to="/" className="nav-link" onClick={closeMenu}>
                        Inicio
                    </Link>
                    <Link to="/productos" className="nav-link" onClick={closeMenu}>
                        Productos
                    </Link>
                    <Link to="/pedido-impresion" className="nav-link" onClick={closeMenu}>
                        Pedido de impresión
                    </Link>
                    <Link to="/nosotros" className="nav-link" onClick={closeMenu}>
                        Nosotros
                    </Link>
                    <Link to="/carrito" className="nav-link nav-link-cart" onClick={closeMenu}>
                        Carrito {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                    </Link>

                    {!user && (
                        <Link to="/login" className="btn-login" onClick={closeMenu}>
                            Iniciar Sesión
                        </Link>
                    )}

                    {user && (
                        <div className="navbar-user-group">
                            {user.rol === 'admin' ? (
                                <Link to="/admin" className="btn-login" onClick={closeMenu}>
                                    Panel Admin
                                </Link>
                            ) : (
                                <Link to="/perfil" className="btn-login" onClick={closeMenu}>
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