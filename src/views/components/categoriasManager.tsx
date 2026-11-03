import React, { useState, useEffect } from 'react';
import './CategoriasManager.css';

export interface Categoria {
    IDCategoria: number;
    nombre: string;
}

interface CategoriaManagerProps {
    onCategoriasChange?: () => void;
}

export function CategoriasManager({ onCategoriasChange }: CategoriaManagerProps) {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [nombre, setNombre] = useState('');
    const [categoriaAEditar, setCategoriaAEditar] = useState<Categoria | null>(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

    const cargarCategorias = async () => {
        try {
            const res = await fetch('/api/categorias');
            if (res.ok) {
                const data = await res.json();
                setCategorias(data);
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    };

    useEffect(() => {
        cargarCategorias();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje(null);

        const nombreLimpio = nombre.trim();
        if (!nombreLimpio) return;

        setCargando(true);
        const esEdicion = Boolean(categoriaAEditar);
        const url = esEdicion ? `/api/categorias/${categoriaAEditar!.IDCategoria}` : '/api/categorias';
        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombreLimpio }),
            });

            if (!res.ok) {
                throw new Error(esEdicion ? 'No se pudo actualizar la categoría.' : 'Error al crear la categoría.');
            }

            setMensaje({
                tipo: 'exito',
                texto: esEdicion ? '¡Categoría actualizada con éxito!' : '¡Categoría creada con éxito!'
            });
            setNombre('');
            setCategoriaAEditar(null);
            cargarCategorias();
            if (onCategoriasChange) onCategoriasChange();
        } catch (err: any) {
            setMensaje({ tipo: 'error', texto: err.message || 'Error al procesar la categoría.' });
        } finally {
            setCargando(false);
        }
    };

    const handleIniciarEdicion = (cat: Categoria) => {
        setCategoriaAEditar(cat);
        setNombre(cat.nombre);
        setMensaje(null);
    };

    const handleCancelarEdicion = () => {
        setCategoriaAEditar(null);
        setNombre('');
        setMensaje(null);
    };

    const handleEliminar = async (id: number, nombreCat: string) => {
        const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${nombreCat}"? Los productos que la tengan pasarán a no tener categoría.`);
        if (!confirmar) return;

        try {
            const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('No se pudo eliminar la categoría.');

            if (categoriaAEditar?.IDCategoria === id) {
                handleCancelarEdicion();
            }
            cargarCategorias();
            if (onCategoriasChange) onCategoriasChange();
        } catch (err: any) {
            alert(err.message || 'Error al eliminar.');
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

            {mensaje && (
                <div className={`category-feedback category-feedback-${mensaje.tipo}`}>
                    <span>{mensaje.texto}</span>
                    <button
                        type="button"
                        className="category-close-alert"
                        onClick={() => setMensaje(null)}
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
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={30}
                    required
                />
                <button type="submit" className="btn-category-submit" disabled={cargando}>
                    {cargando ? 'Guardando...' : categoriaAEditar ? 'Guardar Cambios' : '+ Agregar Categoría'}
                </button>
                {categoriaAEditar && (
                    <button
                        type="button"
                        className="btn-category-cancel"
                        onClick={handleCancelarEdicion}
                        disabled={cargando}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            <div className="category-list-container">
                <span className="category-list-label">Categorías existentes ({categorias.length}):</span>
                {categorias.length === 0 ? (
                    <p className="category-empty-text">No hay categorías creadas todavía.</p>
                ) : (
                    <div className="category-chips-grid">
                        {categorias.map((cat) => (
                            <div
                                key={cat.IDCategoria}
                                className={`category-chip ${categoriaAEditar?.IDCategoria === cat.IDCategoria ? 'category-chip-active' : ''}`}
                            >
                                <span className="category-chip-name">{cat.nombre}</span>
                                <div className="category-chip-actions">
                                    <button
                                        type="button"
                                        className="btn-chip-action btn-chip-edit"
                                        onClick={() => handleIniciarEdicion(cat)}
                                        title="Editar nombre"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-chip-action btn-chip-delete"
                                        onClick={() => handleEliminar(cat.IDCategoria, cat.nombre)}
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
        </article>
    );
}