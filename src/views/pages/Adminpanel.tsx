import React, { useState, useEffect } from 'react';
import { ProductForm, Producto } from '../components/ProductForm';
import './Adminpanel.css';

export function Adminpanel() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);

    const cargarProductos = async () => {
        setCargandoLista(true);
        try {
            const response = await fetch('/api/productos');
            if (response.ok) {
                const data = await response.json();
                setProductos(data);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setCargandoLista(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const handleEliminar = async (id: number, nombre: string) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`);
        if (!confirmar) return;

        try {
            const response = await fetch(`/api/productos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar el producto.');
            }

            // Si estábamos editando justo el producto que se borró, limpiamos el formulario
            if (productoAEditar?.IDProducto === id) {
                setProductoAEditar(null);
            }

            cargarProductos();
        } catch (error: any) {
            alert(error.message || 'Error al eliminar el producto.');
        }
    };

    return (
        <main className="admin-container">
            <header className="admin-header">
                <h2 className="admin-title">Panel de Administración</h2>
                <p className="admin-subtitle">
                    Gestión integral de productos e insumos mayoristas
                </p>
            </header>

            {/* Componente Modular de Formulario */}
            <section className="admin-section">
                <ProductForm
                    productoAEditar={productoAEditar}
                    onGuardarExito={cargarProductos}
                    onCancelarEdicion={() => setProductoAEditar(null)}
                />
            </section>

            {/* Catálogo de Productos con Acciones */}
            <section className="admin-section">
                <h3 className="section-title">
                    <span></span> Productos en el Catálogo ({productos.length})
                </h3>

                {cargandoLista ? (
                    <p className="empty-state">Cargando productos de la base de datos...</p>
                ) : productos.length === 0 ? (
                    <p className="empty-state">
                        No hay productos registrados en el catálogo aún.
                    </p>
                ) : (
                    <div className="products-grid">
                        {productos.map((prod) => (
                            <article key={prod.IDProducto} className="product-item-card">
                                <div>
                                    <div className="product-item-header">
                                        <h4 className="product-item-name">{prod.nombre}</h4>
                                        <span className="product-badge-id">#{prod.IDProducto}</span>
                                    </div>
                                    <p className="product-item-desc">
                                        {prod.descripcion || 'Sin descripción.'}
                                    </p>
                                </div>

                                <div>
                                    <div className="product-item-footer">
                                        <span className="product-item-price-label">Precio</span>
                                        <span className="product-item-price">
                                            ${Number(prod.precio).toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>

                                    {/* Botones de Acción */}
                                    <div className="product-item-actions">
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-edit"
                                            onClick={() => {
                                                setProductoAEditar(prod);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-delete"
                                            onClick={() => handleEliminar(prod.IDProducto, prod.nombre)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
