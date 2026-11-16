import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/cartContext';
import './Products.css';
import { BranchedMenu, BranchedMenuItem } from '../components/BranchedMenu';
import { ProductModal } from '../components/ProductModal';

export interface ProductItem {
    IDProducto: number;
    nombre: string;
    descripcion: string;
    precio: number | string;
    IDCategoria?: number | null;
    categoria?: string;
    imagenes?: { url: string }[];
}

interface CategoryItem {
    IDCategoria: number;
    nombre: string;
}

export function Products() {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addItem } = useCart();
    const [addedId, setAddedId] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

    const handleAddToCart = (product: ProductItem) => {
        addItem(product);
        setAddedId(product.IDProducto);
        setTimeout(() => setAddedId(null), 1500);
    };

    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('todas');

    const [search, setSearch] = useState('');
    const [priceSort, setPriceSort] = useState<'defecto' | 'asc' | 'desc'>('defecto');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/productos');
                if (!res.ok) throw new Error('Error al consultar los productos.');
                const data = await res.json();
                setProducts(data);
            } catch (err: any) {
                setError(err.message || 'No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        fetch('/api/categorias')
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error('Error al cargar categorías:', err));
    }, []);

    const menuItems: BranchedMenuItem[] = useMemo(() => [
        {
            label: 'Todas las Categorías',
            value: 'todas',
            children: [
                { value: 'todas', label: 'Ver todos los productos' },
                ...categories.map((cat) => ({
                    value: String(cat.IDCategoria),
                    label: cat.nombre,
                })),
            ],
        },
    ], [categories]);

    const filteredProducts = useMemo(() => {
        let result = products.filter((prod) => {
            const matchesText =
                prod.nombre.toLowerCase().includes(search.toLowerCase()) ||
                (prod.descripcion && prod.descripcion.toLowerCase().includes(search.toLowerCase()));

            const matchesCategory =
                selectedCategory === 'todas' ||
                String(prod.IDCategoria) === selectedCategory;

            return matchesText && matchesCategory;
        });

        if (priceSort === 'asc') {
            result = [...result].sort((a, b) => Number(a.precio) - Number(b.precio));
        } else if (priceSort === 'desc') {
            result = [...result].sort((a, b) => Number(b.precio) - Number(a.precio));
        }

        return result;
    }, [products, search, priceSort, selectedCategory]);

    const hasActiveFilters = search !== '' || priceSort !== 'defecto' || selectedCategory !== 'todas';

    const clearFilters = () => {
        setSearch('');
        setPriceSort('defecto');
        setSelectedCategory('todas');
    };

    return (
        <main className="products-container">
            <header className="products-header">
                <h1 className="products-title">Catálogo de Insumos</h1>
                <p className="products-subtitle">
                    Explorá nuestros insumos mayoristas y encontrá los mejores precios
                </p>
            </header>

            <section className="catalog-filters-bar">
                <div className="search-filter-group">
                    <input
                        type="text"
                        className="catalog-search-input"
                        placeholder="Buscar por nombre o descripción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            type="button"
                            className="btn-clear-search"
                            onClick={() => setSearch('')}
                            aria-label="Borrar búsqueda"
                        >
                            &times;
                        </button>
                    )}
                </div>

                <div className="selects-filter-group">
                    <select
                        className="catalog-select catalog-select-category-mobile"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        aria-label="Filtrar por categoría"
                    >
                        <option value="todas">Categoría: Todas</option>
                        {categories.map((cat) => (
                            <option key={cat.IDCategoria} value={String(cat.IDCategoria)}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        className="catalog-select"
                        value={priceSort}
                        onChange={(e) => setPriceSort(e.target.value as 'defecto' | 'asc' | 'desc')}
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
                        defaultActive={selectedCategory}
                        onSelect={(val) => setSelectedCategory(val)}
                        color="#2b211b"
                        accentColor="#b91c1c"
                        lineColor="#ebdcd0"
                        width={240}
                    />
                </aside>

                <section className="catalog-content">
                    <div className="catalog-meta-row">
                        <span className="catalog-counter">
                            Mostrando <strong>{filteredProducts.length}</strong> de {products.length} insumos
                        </span>

                        {hasActiveFilters && (
                            <button type="button" className="btn-reset-filters" onClick={clearFilters}>
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="catalog-status-box">
                            <p>Cargando catálogo de insumos...</p>
                        </div>
                    ) : error ? (
                        <div className="catalog-status-box catalog-error">
                            <p>{error}</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="catalog-status-box">
                            <p className="catalog-empty-title">No se encontraron productos</p>
                            <p className="catalog-empty-desc">
                                No hay insumos que coincidan con los filtros aplicados.
                            </p>
                            {hasActiveFilters && (
                                <button type="button" className="btn-reset-filters" onClick={clearFilters}>
                                    Restablecer todos los filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="catalog-grid">
                            {filteredProducts.map((prod) => (
                                <article
                                    key={prod.IDProducto}
                                    className="catalog-card clickable"
                                    onClick={() => setSelectedProduct(prod)}
                                >
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

                                        <button
                                            type="button"
                                            className="btn-view-details"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduct(prod);
                                            }}
                                        >
                                            Ver detalles
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAdd={handleAddToCart}
                    addedId={addedId}
                />
            )}
        </main>
    );
}
