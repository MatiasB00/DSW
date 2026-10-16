import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export function Navbar() {
    return (
        <header className="navbar">
            <div className="navbar-brand">
                <Link to="/" className="navbar-logo">
                    Imprenta Mayorista
                </Link>
            </div>

            <nav className="navbar-nav">
                <Link to="/" className="nav-link">Inicio</Link>
                <Link to="/nosotros" className="nav-link">Nosotros</Link>
                <Link to="/admin" className="nav-link">Panel Admin</Link>
                <Link to="/login" className="btn-login">Iniciar Sesión</Link>
            </nav>
        </header>
    );
}
