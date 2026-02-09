import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { X, Minus, Plus, Trash2, ShoppingCart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function CartSidebar() {
    const { items, itemCount, total, isOpen, setIsOpen, updateQuantity, removeItem, clearCart } = useCart();

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-gray-900">Giỏ hàng ({itemCount})</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <ShoppingCart className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-gray-500 mb-2">Giỏ hàng trống</p>
                            <p className="text-gray-400 text-sm mb-4">Hãy khám phá và thêm sản phẩm yêu thích!</p>
                            <Button
                                onClick={() => setIsOpen(false)}
                                className="bg-primary hover:bg-red-700"
                            >
                                Khám phá ngay
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={`${item.id}-${item.color}`}
                                    className="flex gap-3 p-3 bg-gray-50 rounded-xl"
                                >
                                    {/* Product Image */}
                                    <Link
                                        to={`/products/${item.slug}`}
                                        onClick={() => setIsOpen(false)}
                                        className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0"
                                    >
                                        <img
                                            src={item.image || 'https://via.placeholder.com/80'}
                                            alt={item.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </Link>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={`/products/${item.slug}`}
                                            onClick={() => setIsOpen(false)}
                                            className="font-medium text-gray-800 text-sm line-clamp-2 hover:text-primary transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                        {item.color && (
                                            <p className="text-xs text-gray-500 mt-1">Màu: {item.color}</p>
                                        )}
                                        <p className="text-primary font-bold text-sm mt-1">
                                            {formatCurrency(item.price)}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.color, item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-l-lg transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.color, item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-r-lg transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id, item.color)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Clear Cart */}
                            <button
                                onClick={clearCart}
                                className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                            >
                                Xóa toàn bộ giỏ hàng
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer - Checkout */}
                {items.length > 0 && (
                    <div className="border-t p-4 bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600">Tạm tính:</span>
                            <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                className="border-gray-300"
                            >
                                Tiếp tục mua
                            </Button>
                            <Link to="/checkout" onClick={() => setIsOpen(false)}>
                                <Button className="w-full bg-primary hover:bg-red-700 flex items-center gap-2">
                                    Thanh toán
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
