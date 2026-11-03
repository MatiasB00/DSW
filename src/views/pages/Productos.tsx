import React, { useState, useEffect, useMemo } from 'react';
import { useCarrito } from '../context/carritoContext';
import './Productos.css';
import { BranchedMenu, BranchedMenuItem } from '../components/BranchedMenu';

export interface ProductoItem {
    IDProducto: number;
    nombre: string;
    descripcion: string;
    precio: number | string;
    IDCategoria?: number | null;
    categoria?: string;
}

interface CategoriaItem {
    IDCategoria: number;
    nombre: string;
}

export function Productos() {
    const [productos, setProductos] = useState<ProductoItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { agregarProducto } = useCarrito();
    const [agregadoId, setAgregadoId] = useState<number | null>(null);
    const handleAgregar = (prod: ProductoItem) => {
        agregarProducto(prod);
        setAgregadoId(prod.IDProducto);
        setTimeout(() => setAgregadoId(null), 1500);
    };
    const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');

    const [busqueda, setBusqueda] = useState('');
    const [ordenPrecio, setOrdenPrecio] = useState<'defecto' | 'asc' | 'desc'>('defecto');

    useEffect(() => {
        const cargarProductos = async () => {
            try {
                setCargando(true);
                const res = await fetch('/api/productos');
                if (!res.ok) throw new Error('Error al consultar los productos.');
                const data = await res.json();
                setProductos(data);
            } catch (err: any) {
                setError(err.message || 'No se pudieron cargar los productos.');
            } finally {
                setCargando(false);
            }
        };

        cargarProductos();
    }, []);

    useEffect(() => {
        fetch('/api/categorias')
            .then((res) => res.json())
            .then((data) => setCategorias(data))
            .catch((err) => console.error('Error al cargar categorías:', err));
    }, []);

    const menuItems: BranchedMenuItem[] = useMemo(() => [
        {
            label: 'Todas las Categorías',
            value: 'todas',
            children: [
                { value: 'todas', label: 'Ver todos los productos' },
                ...categorias.map((cat) => ({
                    value: String(cat.IDCategoria),
                    label: cat.nombre,
                })),
            ],
        },
    ], [categorias]);

    const productosFiltrados = useMemo(() => {
        let resultado = productos.filter((prod) => {
            const coincideTexto =
                prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                (prod.descripcion && prod.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

            const coincideCategoria =
                categoriaSeleccionada === 'todas' ||
                String(prod.IDCategoria) === categoriaSeleccionada;

            return coincideTexto && coincideCategoria;
        });

        if (ordenPrecio === 'asc') {
            resultado = [...resultado].sort((a, b) => Number(a.precio) - Number(b.precio));
        } else if (ordenPrecio === 'desc') {
            resultado = [...resultado].sort((a, b) => Number(b.precio) - Number(a.precio));
        }

        return resultado;
    }, [productos, busqueda, ordenPrecio, categoriaSeleccionada]);

    const hayFiltrosActivos = busqueda !== '' || ordenPrecio !== 'defecto' || categoriaSeleccionada !== 'todas';

    const limpiarFiltros = () => {
        setBusqueda('');
        setOrdenPrecio('defecto');
        setCategoriaSeleccionada('todas');
    };

    return (
        <main className="productos-container">
            <header className="productos-header">
                <h1 className="productos-title">Catálogo de Insumos</h1>
                <p className="productos-subtitle">
                    Explorá nuestros insumos mayoristas y encontrá los mejores precios
                </p>
            </header>

            <section className="catalog-filters-bar">
                <div className="search-filter-group">
                    <input
                        type="text"
                        className="catalog-search-input"
                        placeholder="Buscar por nombre o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button
                            type="button"
                            className="btn-clear-search"
                            onClick={() => setBusqueda('')}
                            aria-label="Borrar búsqueda"
                        >
                            &times;
                        </button>
                    )}
                </div>

                <div className="selects-filter-group">
                    <select
                        className="catalog-select catalog-select-category-mobile"
                        value={categoriaSeleccionada}
                        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                        aria-label="Filtrar por categoría"
                    >
                        <option value="todas">Categoría: Todas</option>
                        {categorias.map((cat) => (
                            <option key={cat.IDCategoria} value={String(cat.IDCategoria)}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        className="catalog-select"
                        value={ordenPrecio}
                        onChange={(e) => setOrdenPrecio(e.target.value as 'defecto' | 'asc' | 'desc')}
                    >
                        <option value="defecto">Ordenar por: Predeterminado</option>
                        <option value="asc">Precio: Menor a mayor</option>
                        <option value="desc">Precio: Mayor a menor</option>
                    </select>
                </div>
            </section>

            <div className="catalog-layout">
                <aside className="catalog-sidebar" aria-label="Filtro de categorías">
                    <h3 className="catalog-sidebar-title">Categorías</h3>
                    <BranchedMenu
                        items={menuItems}
                        defaultOpen={[0]}
                        defaultActive={categoriaSeleccionada}
                        onSelect={(val) => setCategoriaSeleccionada(val)}
                        color="#2b211b"
                        accentColor="#b91c1c"
                        lineColor="#ebdcd0"
                        width={240}
                    />
                </aside>

                <section className="catalog-content">
                    <div className="catalog-meta-row">
                        <span className="catalog-counter">
                            Mostrando <strong>{productosFiltrados.length}</strong> de {productos.length} insumos
                        </span>

                        {hayFiltrosActivos && (
                            <button type="button" className="btn-reset-filters" onClick={limpiarFiltros}>
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {cargando ? (
                        <div className="catalog-status-box">
                            <p>Cargando catálogo de insumos...</p>
                        </div>
                    ) : error ? (
                        <div className="catalog-status-box catalog-error">
                            <p>{error}</p>
                        </div>
                    ) : productosFiltrados.length === 0 ? (
                        <div className="catalog-status-box">
                            <p className="catalog-empty-title">No se encontraron productos</p>
                            <p className="catalog-empty-desc">
                                No hay insumos que coincidan con los filtros aplicados.
                            </p>
                            {hayFiltrosActivos && (
                                <button type="button" className="btn-reset-filters" onClick={limpiarFiltros}>
                                    Restablecer todos los filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="catalog-grid">
                            {productosFiltrados.map((prod) => (
                                <article key={prod.IDProducto} className="catalog-card">
                                    <div className="catalog-card-body">

                                        <h2 className="catalog-card-title">{prod.nombre}</h2>

                                        <p className="catalog-card-desc" title={prod.descripcion}>
                                            {prod.descripcion || 'Sin descripción disponible para este insumo.'}
                                        </p>
                                    </div>

                                    <div className="catalog-card-footer">
                                        <div className="catalog-card-price-block">
                                            <span className="catalog-price-label">Precio Unitario</span>
                                            <span className="catalog-price-val">
                                                ${Number(prod.precio).toLocaleString('es-AR', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>

                                        <button type="button" className={`btn-add-order ${agregadoId === prod.IDProducto ? 'btn-added' : ''}`} onClick={() => handleAgregar(prod)}>
                                            {agregadoId === prod.IDProducto ? '¡Agregado!' : 'Agregar al Pedido'}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}