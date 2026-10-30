import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CarritoItem {
    IDProducto: number;
    nombre: string;
    precio: number;
    cantidad: number;
    proveedorNombre?: string;
}

interface CarritoContextType {
    items: CarritoItem[];
    agregarProducto: (producto: { IDProducto: number; nombre: string; precio: number | string }) => void;
    eliminarProducto: (id: number) => void;
    actualizarCantidad: (id: number, cantidad: number) => void;
    vaciarCarrito: () => void;
    totalItems: number;
    totalPrecio: number;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export function CarritoProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CarritoItem[]>(() => {
        const guardado = localStorage.getItem('imprenta_carrito');
        return guardado ? JSON.parse(guardado) : [];
    });

    useEffect(() => {
        localStorage.setItem('imprenta_carrito', JSON.stringify(items));
    }, [items]);

    const agregarProducto = (prod: { IDProducto: number; nombre: string; precio: number | string }) => {
        setItems((prev) => {
            const existente = prev.find((item) => item.IDProducto === prod.IDProducto);
            const precioNum = Number(prod.precio);

            if (existente) {
                return prev.map((item) =>
                    item.IDProducto === prod.IDProducto
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    IDProducto: prod.IDProducto,
                    nombre: prod.nombre,
                    precio: precioNum,
                    cantidad: 1,
                },
            ];
        });
    };

    const eliminarProducto = (id: number) => {
        setItems((prev) => prev.filter((item) => item.IDProducto !== id));
    };

    const actualizarCantidad = (id: number, cantidad: number) => {
        if (cantidad <= 0) {
            eliminarProducto(id);
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.IDProducto === id ? { ...item, cantidad } : item
            )
        );
    };

    const vaciarCarrito = () => {
        setItems([]);
    };

    const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);
    const totalPrecio = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    return (
        <CarritoContext.Provider
            value={{
                items,
                agregarProducto,
                eliminarProducto,
                actualizarCantidad,
                vaciarCarrito,
                totalItems,
                totalPrecio,
            }}
        >
            {children}
        </CarritoContext.Provider>
    );
}

export function useCarrito() {
    const context = useContext(CarritoContext);
    if (!context) {
        throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
    }
    return context;
}