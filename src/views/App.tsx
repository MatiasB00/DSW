import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CarritoProvider } from './context/carritoContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Nosotros } from './pages/Nosotros';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Adminpanel } from './pages/Adminpanel';
import { Perfil } from './pages/Perfil';
import { Productos } from './pages/Productos';
import { Carrito } from './pages/Carrito';

export function App() {
  return (
    <BrowserRouter>
      <CarritoProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Adminpanel />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/carrito" element={<Carrito />} />
        </Routes>
      </CarritoProvider>
    </BrowserRouter>
  );
}