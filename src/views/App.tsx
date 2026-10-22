import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Nosotros } from './pages/Nosotros';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Adminpanel } from './pages/Adminpanel';

export function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Adminpanel />} />
      </Routes>
    </BrowserRouter>
  );
}
