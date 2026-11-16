import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    IDProducto: number;
    nombre: string;
    precio: number;
    cantidad: number;
    proveedorNombre?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: { IDProducto: number; nombre: string; precio: number | string }) => void;
    removeItem: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('imprenta_carrito');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('imprenta_carrito', JSON.stringify(items));
    }, [items]);

    const addItem = (product: { IDProducto: number; nombre: string; precio: number | string }) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.IDProducto === product.IDProducto);
            const priceNum = Number(product.precio);

            if (existing) {
                return prev.map((item) =>
                    item.IDProducto === product.IDProducto
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    IDProducto: product.IDProducto,
                    nombre: product.nombre,
                    precio: priceNum,
                    cantidad: 1,
                },
            ];
        });
    };

    const removeItem = (id: number) => {
        setItems((prev) => prev.filter((item) => item.IDProducto !== id));
    };

    const updateQuantity = (id: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(id);
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.IDProducto === id ? { ...item, cantidad: quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);
    const totalPrice = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
