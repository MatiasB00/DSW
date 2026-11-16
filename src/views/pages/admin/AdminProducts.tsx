import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/apiFetch';
import { ProductForm, Product } from '../../components/ProductForm';
import { CategoriesManager } from '../../components/CategoriesManager';
import './AdminProducts.css';

interface AdminProductsProps {
    onCountChange?: (count: number) => void;
}

export function AdminProducts({ onCountChange }: AdminProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [categoriesVersion, setCategoriesVersion] = useState(0);

    const [historyProduct, setHistoryProduct] = useState<{ id: number; nombre: string } | null>(null);
    const [priceHistory, setPriceHistory] = useState<Array<{ fechaDesde: string; valor: number | string }>>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const response = await apiFetch('/api/productos');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
                if (onCountChange) onCountChange(data.length);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const refreshCategories = () => {
        setCategoriesVersion((prev) => prev + 1);
        loadProducts();
    };

    const handleDeleteProduct = async (id: number, productName: string) => {
        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar "${productName}"?`);
        if (!confirmed) return;

        try {
            const response = await apiFetch(`/api/productos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar el producto.');
            }

            if (productToEdit?.IDProducto === id) {
                setProductToEdit(null);
            }

            loadProducts();
        } catch (error: any) {
            alert(error.message || 'Error al eliminar el producto.');
        }
    };

    const handleOpenHistory = async (id: number, productName: string) => {
        setHistoryProduct({ id, nombre: productName });
        setLoadingHistory(true);
        setHistoryError(null);
        try {
            const response = await apiFetch(`/api/productos/${id}/precios`);
            if (!response.ok) {
                throw new Error('No se pudo obtener el historial de precios.');
            }
            const data = await response.json();
            setPriceHistory(data);
        } catch (err: any) {
            setHistoryError(err.message || 'Error al cargar el historial.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleCloseHistory = () => {
        setHistoryProduct(null);
        setPriceHistory([]);
        setHistoryError(null);
    };

    useEffect(() => {
        if (historyProduct) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [historyProduct]);

    return (
        <>
            <ProductForm
                productToEdit={productToEdit}
                categoriesVersion={categoriesVersion}
                onSaveSuccess={() => {
                    loadProducts();
                    setProductToEdit(null);
                }}
                onCancelEdit={() => setProductToEdit(null)}
            />

            <CategoriesManager onCategoriesChange={refreshCategories} />

            <section className="admin-section">
                <div className="section-header-row">
                    <h3 className="section-title">
                        Productos en el Catálogo ({products.length})
                    </h3>
                </div>

                {loadingProducts ? (
                    <p className="empty-state">Cargando productos de la base de datos...</p>
                ) : products.length === 0 ? (
                    <p className="empty-state">No hay productos registrados en el catálogo aún.</p>
                ) : (
                    <div className="products-grid">
                        {products.map((prod) => (
                            <article key={prod.IDProducto} className="product-item-card">
                                <div>
                                    <div className="product-item-header">
                                        <h4 className="product-item-name">{prod.nombre}</h4>
                                    </div>

                                    <div className="product-item-prov">
                                        {prod.categoria ? `${prod.categoria} • ` : ''}
                                        {prod.proveedorNombre || 'Proveedor no especificado'}
                                    </div>

                                    <div className="product-item-stock">
                                        <strong>Stock: {prod.stock ?? 0} u.</strong>
                                    </div>

                                    <p className="product-item-desc" title={prod.descripcion}>
                                        {prod.descripcion || 'Sin descripción.'}
                                    </p>
                                </div>

                                <div>
                                    <div className="product-item-footer">
                                        <span className="product-item-price-label">Precio Vigente</span>
                                        <span className="product-item-price">
                                            ${Number(prod.precio).toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>

                                    <div className="product-item-actions">
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-history"
                                            onClick={() => handleOpenHistory(prod.IDProducto, prod.nombre)}
                                        >
                                            Hist. de Precios
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-delete"
                                            onClick={() => handleDeleteProduct(prod.IDProducto, prod.nombre)}
                                        >
                                            Eliminar
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-card-action btn-card-edit btn-card-full"
                                            onClick={() => {
                                                setProductToEdit(prod);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            Editar Producto
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {historyProduct && (
                <div className="modal-overlay" onClick={handleCloseHistory}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">Historial de Precios</h3>
                                <p className="modal-subtitle">{historyProduct.nombre}</p>
                            </div>
                            <button
                                type="button"
                                className="modal-close-icon"
                                onClick={handleCloseHistory}
                                aria-label="Cerrar modal"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            {loadingHistory ? (
                                <p className="empty-state">Cargando precios...</p>
                            ) : historyError ? (
                                <p className="empty-state">{historyError}</p>
                            ) : priceHistory.length === 0 ? (
                                <p className="empty-state">No hay registros de precios para este producto.</p>
                            ) : (
                                priceHistory.map((item, index) => {
                                    const isCurrent = index === 0;
                                    const formattedDate = new Date(item.fechaDesde).toLocaleString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    });

                                    return (
                                        <div
                                            key={item.fechaDesde}
                                            className={`history-item ${isCurrent ? 'history-item-current' : ''}`}
                                        >
                                            <div className="history-item-left">
                                                <span className="history-date">{formattedDate}</span>
                                            </div>
                                            <div className="history-price">
                                                ${Number(item.valor).toLocaleString('es-AR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-modal-close"
                                onClick={handleCloseHistory}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
