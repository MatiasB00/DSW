import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/cartContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { AboutUs } from './pages/AboutUs';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';
import { Products } from './pages/Products';
import { Cart } from './pages/Cart';
import { RequireAdmin } from './components/RequireAdmin';
import { RequireAuth } from './components/RequireAuth';
import { PrintOrder } from './pages/PrintOrder';

export function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<AboutUs />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
          <Route path="/pedido-impresion" element={<RequireAuth><PrintOrder /></RequireAuth>} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/carrito" element={<Cart />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
