import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiFetch';
import { ConfirmModal } from './ConfirmModal';
import './CategoriesManager.css';

export interface Category {
    IDCategoria: number;
    nombre: string;
}

interface CategoriesManagerProps {
    onCategoriesChange?: () => void;
}

export function CategoriesManager({ onCategoriesChange }: CategoriesManagerProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadCategories = async () => {
        try {
            const res = await apiFetch('/api/categorias');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const trimmedName = name.trim();
        if (!trimmedName) return;

        setLoading(true);
        const isEditing = Boolean(editingCategory);
        const url = isEditing ? `/api/categorias/${editingCategory!.IDCategoria}` : '/api/categorias';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: trimmedName }),
            });

            if (!res.ok) {
                throw new Error(isEditing ? 'No se pudo actualizar la categoría.' : 'Error al crear la categoría.');
            }

            setMessage({
                type: 'success',
                text: isEditing ? '¡Categoría actualizada con éxito!' : '¡Categoría creada con éxito!'
            });
            setName('');
            setEditingCategory(null);
            loadCategories();
            if (onCategoriesChange) onCategoriesChange();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error al procesar la categoría.' });
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.nombre);
        setMessage(null);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setName('');
        setMessage(null);
    };

    const executeDelete = async (id: number) => {
        try {
            const res = await apiFetch(`/api/categorias/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('No se pudo eliminar la categoría.');

            if (editingCategory?.IDCategoria === id) {
                handleCancelEdit();
            }
            loadCategories();
            if (onCategoriesChange) onCategoriesChange();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error al eliminar la categoría.' });
        }
    };

    return (
        <article className="category-manager-card">
            <header className="category-manager-header">
                <div>
                    <h3 className="category-manager-title">Gestión de Categorías</h3>
                    <p className="category-manager-subtitle">
                        Crea y administra las categorías disponibles para clasificar los productos
                    </p>
                </div>
            </header>

            {message && (
                <div className={`category-feedback category-feedback-${message.type}`}>
                    <span>{message.text}</span>
                    <button
                        type="button"
                        className="category-close-alert"
                        onClick={() => setMessage(null)}
                        aria-label="Cerrar notificación"
                    >
                        &times;
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="category-form-row">
                <input
                    type="text"
                    className="category-input"
                    placeholder="Ej: Papelería, Tintas, Vinilos..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    required
                />
                <button type="submit" className="btn-category-submit" disabled={loading}>
                    {loading ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : '+ Agregar Categoría'}
                </button>
                {editingCategory && (
                    <button
                        type="button"
                        className="btn-category-cancel"
                        onClick={handleCancelEdit}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            <div className="category-list-container">
                <span className="category-list-label">Categorías existentes ({categories.length}):</span>
                {categories.length === 0 ? (
                    <p className="category-empty-text">No hay categorías creadas todavía.</p>
                ) : (
                    <div className="category-chips-grid">
                        {categories.map((cat) => (
                            <div
                                key={cat.IDCategoria}
                                className={`category-chip ${editingCategory?.IDCategoria === cat.IDCategoria ? 'category-chip-active' : ''}`}
                            >
                                <span className="category-chip-name">{cat.nombre}</span>
                                <div className="category-chip-actions">
                                    <button
                                        type="button"
                                        className="btn-chip-action btn-chip-edit"
                                        onClick={() => handleStartEdit(cat)}
                                        title="Editar nombre"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-chip-action btn-chip-delete"
                                        onClick={() => setCategoryToDelete(cat)}
                                        title="Eliminar categoría"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={Boolean(categoryToDelete)}
                title="Eliminar Categoría"
                message={`¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete?.nombre}"? Los productos que la tengan pasarán a no tener categoría.`}
                confirmText="Eliminar Categoría"
                isDestructive={true}
                onCancel={() => setCategoryToDelete(null)}
                onConfirm={async () => {
                    if (categoryToDelete) {
                        await executeDelete(categoryToDelete.IDCategoria);
                        setCategoryToDelete(null);
                    }
                }}
            />
        </article>
    );
}
