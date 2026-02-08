import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Building2,
    Package,
    ShoppingCart,
    Wrench,
    FileText,
    Settings,
    LogOut,
    LayoutDashboard,
    Boxes,
    Menu,
    X,
    Users,
    BookOpen,
    BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
    { icon: Boxes, label: 'Kho hàng', path: '/admin/inventory' },
    { icon: Users, label: 'Khách hàng', path: '/admin/customers' },
    { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/sales' },
    { icon: Wrench, label: 'Sửa chữa', path: '/admin/repair', badge: 'New' },
    { icon: BookOpen, label: 'Tài khoản', path: '/admin/accounts' },
    { icon: FileText, label: 'Bút toán', path: '/admin/journal' },
    { icon: BarChart3, label: 'Báo cáo', path: '/admin/reports' },
];

export const AniqSidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white shadow-md rounded-lg border border-border"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <AnimatePresence>
                {(isOpen || window.innerWidth >= 768) && (
                    <motion.aside
                        initial={{ x: -250 }}
                        animate={{ x: 0 }}
                        exit={{ x: -250 }}
                        className={cn(
                            "fixed left-0 top-0 h-screen w-64 bg-white border-r border-border z-40 flex flex-col pt-6 pb-4 shadow-sm",
                            "transition-transform duration-300 ease-in-out md:translate-x-0",
                            isOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                    >
                        {/* Logo */}
                        <div className="px-6 mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
                                <Building2 className="text-white w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-foreground tracking-tight">OTNT ERP</h1>
                                <p className="text-xs text-muted-foreground">Robot Vacuum System</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                            <div className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Menu chính
                            </div>

                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.path || 
                                    (item.path !== '/admin' && location.pathname.startsWith(item.path));

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <item.icon size={18} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold uppercase bg-primary text-white rounded-md shadow-sm">
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* User Profile */}
                        <div className="mt-auto px-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium text-foreground truncate">{user?.full_name || 'User'}</p>
                                    <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || 'Staff'}</p>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={16} className="text-muted-foreground hover:text-destructive transition-colors" />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};
