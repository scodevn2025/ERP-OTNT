import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        // Load from localStorage on init
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [isOpen, setIsOpen] = useState(false);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addItem = (product, quantity = 1, color = null) => {
        setItems(prev => {
            const existingIndex = prev.findIndex(
                item => item.id === product.id && item.color === color
            );

            if (existingIndex > -1) {
                // Update quantity
                const updated = [...prev];
                updated[existingIndex].quantity += quantity;
                toast.success(`Đã cập nhật số lượng ${product.name}`);
                return updated;
            }

            // Add new item
            toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
            return [...prev, {
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.images?.[0] || '',
                quantity,
                color
            }];
        });
        setIsOpen(true);
    };

    const updateQuantity = (itemId, color, quantity) => {
        if (quantity < 1) {
            removeItem(itemId, color);
            return;
        }

        setItems(prev => prev.map(item =>
            item.id === itemId && item.color === color
                ? { ...item, quantity }
                : item
        ));
    };

    const removeItem = (itemId, color) => {
        setItems(prev => prev.filter(
            item => !(item.id === itemId && item.color === color)
        ));
        toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
    };

    const clearCart = () => {
        setItems([]);
        toast.info('Đã xóa toàn bộ giỏ hàng');
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            itemCount,
            total,
            isOpen,
            setIsOpen,
            addItem,
            updateQuantity,
            removeItem,
            clearCart
        }}>
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
