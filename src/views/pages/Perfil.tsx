import React from 'react';
import './Perfil.css';

export function Perfil() {
    const usuarioGuardado = localStorage.getItem('user');
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    return (
        <main className="perfil-container">
            <h1 className="perfil-titulo">
                Mi Perfil {usuario ? `- ${usuario.nombre} ${usuario.apellido}` : ''}
            </h1>
            <p className="perfil-meta">
                Email: <strong>{usuario?.email}</strong>
            </p>
            <div className="perfil-card">
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
            </div>
        </main>
    );
}
