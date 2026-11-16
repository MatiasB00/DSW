import React, { useEffect } from 'react';
import { ProductItem } from '../pages/Products';
import './ProductModal.css';

interface ProductModalProps {
    product: ProductItem | null;
    onClose: () => void;
    onAdd: (product: ProductItem) => void;
    addedId: number | null;
}

export function ProductModal({ product, onClose, onAdd, addedId }: ProductModalProps) {
    useEffect(() => {
        if (!product) return;

        document.body.classList.add('modal-open');

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('modal-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [product, onClose]);

    if (!product) return null;

    const isAdded = addedId === product.IDProducto;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{product.nombre}</h2>
                    </div>
                    <button
                        type="button"
                        className="modal-close-icon"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        &times;
                    </button>
                </div>

                <div className="modal-body product-modal-body">
                    <div className="product-modal-img-container">
                        {product.imagenes?.[0]?.url ? (
                            <img
                                src={product.imagenes[0].url}
                                alt={product.nombre}
                                className="product-modal-img"
                            />
                        ) : (
                            <div className="product-modal-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                                <span>Insumo Gráfico</span>
                            </div>
                        )}
                    </div>

                    <div className="product-modal-info">
                        <p className="product-modal-desc">
                            {product.descripcion || 'Sin descripción detallada para este insumo.'}
                        </p>

                        <div className="product-modal-price">
                            <span className="product-modal-price-label">Precio:</span>
                            <span className="product-modal-price-val">
                                ${Number(product.precio).toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer product-modal-footer">
                    <button type="button" className="btn-modal-close" onClick={onClose}>
                        Seguir Explorando
                    </button>
                    <button
                        type="button"
                        className={`btn-add-order ${isAdded ? 'btn-added' : ''}`}
                        onClick={() => onAdd(product)}
                    >
                        {isAdded ? '¡Agregado!' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
        </div>
    );
}
