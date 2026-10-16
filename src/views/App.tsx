import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/nosotros" element={<div style={{ padding: '3rem', textAlign: 'center' }}><h2>Sobre Nosotros (Próximamente)</h2></div>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<div style={{ padding: '3rem', textAlign: 'center' }}><h2>Panel de Administración (Próximamente)</h2></div>} />
            </Routes>
        </BrowserRouter>
    );
}
