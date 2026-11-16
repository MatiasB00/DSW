import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiFetch';
import './ProductForm.css';

export interface Product {
    IDProducto: number;
    nombre: string;
    descripcion: string;
    stock?: number;
    precio: number | string;
    IDProveedor?: number;
    proveedorNombre?: string;
    IDCategoria?: number | null;
    categoria?: string;
}

interface ProductFormProps {
    productToEdit: Product | null;
    categoriesVersion?: number;
    onSaveSuccess: () => void;
    onCancelEdit: () => void;
}

export function ProductForm({ productToEdit, onSaveSuccess, onCancelEdit, categoriesVersion }: ProductFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [stock, setStock] = useState<number | ''>('');
    const [price, setPrice] = useState('');
    const [providerId, setProviderId] = useState<number | ''>('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [providers, setProviders] = useState<Array<{ IDProveedor: number; razonSocial: string }>>([]);
    const [categories, setCategories] = useState<Array<{ IDCategoria: number; nombre: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        apiFetch('/api/proveedores')
            .then((res) => res.json())
            .then((data) => setProviders(data))
            .catch((err) => console.error('Error al cargar proveedores:', err));
    }, []);

    useEffect(() => {
        apiFetch('/api/categorias')
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error('Error al cargar categorías:', err));
    }, [categoriesVersion]);

    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.nombre);
            setDescription(productToEdit.descripcion || '');
            setStock(productToEdit.stock !== undefined ? productToEdit.stock : '');
            setPrice(String(productToEdit.precio));
            setProviderId(productToEdit.IDProveedor || '');
            setCategoryId(productToEdit.IDCategoria || '');
            setMessage(null);
        } else {
            setName('');
            setDescription('');
            setStock('');
            setPrice('');
            setProviderId('');
            setCategoryId('');
        }
    }, [productToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        setLoading(true);
        const isEditing = Boolean(productToEdit);

        try {
            if (isEditing) {
                const resProd = await apiFetch(`/api/productos/${productToEdit!.IDProducto}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: name.trim(),
                        descripcion: description.trim(),
                        stock: stock !== '' ? Number(stock) : 0,
                        IDProveedor: providerId ? Number(providerId) : null,
                        IDCategoria: categoryId ? Number(categoryId) : null,
                    }),
                });
                if (!resProd.ok) throw new Error('No se pudo actualizar el producto.');

                if (Number(price) !== Number(productToEdit!.precio)) {
                    const resPrecio = await apiFetch(`/api/productos/${productToEdit!.IDProducto}/precios`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ valor: Number(price) }),
                    });
                    if (!resPrecio.ok) throw new Error('No se pudo actualizar el precio.');
                }

                setMessage({ type: 'success', text: '¡Producto y precio actualizados con éxito!' });
            } else {
                const resProd = await apiFetch('/api/productos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: name.trim(),
                        descripcion: description.trim(),
                        stock: stock !== '' ? Number(stock) : 0,
                        IDProveedor: providerId ? Number(providerId) : null,
                        IDCategoria: categoryId ? Number(categoryId) : null,
                    }),
                });
                if (!resProd.ok) throw new Error('Error al crear el producto.');

                const dataProd = await resProd.json();

                const resPrecio = await apiFetch(`/api/productos/${dataProd.id}/precios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ valor: Number(price) }),
                });
                if (!resPrecio.ok) throw new Error('El producto se creó, pero no se pudo guardar su precio inicial.');

                setMessage({ type: 'success', text: '¡Producto y precio inicial creados con éxito!' });
                setName('');
                setDescription('');
                setStock('');
                setPrice('');
                setProviderId('');
                setCategoryId('');
            }

            onSaveSuccess();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al procesar la solicitud.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <article className="product-form-card">
            <header className="product-form-header">
                <h3 className="product-form-title">
                    {productToEdit ? `Editar Producto #${productToEdit.IDProducto}` : 'Registrar Nuevo Producto'}
                </h3>
                <p className="product-form-subtitle">
                    {productToEdit
                        ? 'Modifica los datos del producto o actualiza su precio de cotización'
                        : 'Ingresa los datos del insumo o producto y su proveedor'}
                </p>
            </header>

            {message && (
                <div className={`form-feedback-alert feedback-${message.type}`}>
                    {message.text}
                    <button className="close-alert-btn" type="button" onClick={() => setMessage(null)} aria-label='Cerrar notificacion'>
                        X
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="product-form-grid">
                <div className="form-group-item full-width">
                    <label htmlFor="prod-nombre" className="field-label">Nombre del Producto *</label>
                    <input
                        id="prod-nombre"
                        type="text"
                        className="field-control"
                        placeholder="Ej: Resma Papel A4 75g Chambril"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-item">
                    <label htmlFor="prod-proveedor" className="field-label">Proveedor</label>
                    <select
                        id="prod-proveedor"
                        className="field-control"
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value="">-- Sin Proveedor --</option>
                        {providers.map((prov) => (
                            <option key={prov.IDProveedor} value={prov.IDProveedor}>
                                {prov.razonSocial}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group-item">
                    <label htmlFor="prod-categoria" className="field-label">Categoría</label>
                    <select
                        id="prod-categoria"
                        className="field-control"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value="">-- Sin Categoría --</option>
                        {categories.map((cat) => (
                            <option key={cat.IDCategoria} value={cat.IDCategoria}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group-item">
                    <label htmlFor="prod-precio" className="field-label">Precio Vigente ($) *</label>
                    <input
                        id="prod-precio"
                        type="number"
                        step="0.01"
                        min="0"
                        className="field-control"
                        placeholder="Ej: 12500.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-item">
                    <label htmlFor="prod-stock" className="field-label">Stock Inicial *</label>
                    <input
                        id="prod-stock"
                        type="number"
                        min="0"
                        step="1"
                        className="field-control"
                        placeholder="Ej: 100"
                        value={stock}
                        onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                    />
                </div>

                <div className="form-group-item full-width">
                    <label htmlFor="prod-desc" className="field-label">Descripción</label>
                    <textarea
                        id="prod-desc"
                        rows={5}
                        className="field-control field-textarea"
                        placeholder="Especificaciones técnicas, gramaje, terminación..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="form-actions-bar full-width">
                    {productToEdit && (
                        <button
                            type="button"
                            className="btn-cancel-action"
                            onClick={onCancelEdit}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="btn-save-submit" disabled={loading}>
                        {loading ? 'Guardando...' : productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </form>
        </article>
    );
}
