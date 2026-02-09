import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Layers,
  Award,
  Warehouse,
  ShoppingCart,
  Wrench,
  Users,
  LogOut,
  ChevronRight,
  Store,
  Barcode,
  UserCircle,
  Calculator,
  FileText,
  BarChart3,
  Building2,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
  { icon: Layers, label: 'Danh mục', path: '/admin/categories' },
  { icon: Award, label: 'Thương hiệu', path: '/admin/brands' },
  { icon: Warehouse, label: 'Kho hàng', path: '/admin/warehouses' },
  { icon: ShoppingCart, label: 'Nhập xuất kho', path: '/admin/inventory' },
  { icon: Barcode, label: 'Serial/IMEI', path: '/admin/serials' },
  { icon: UserCircle, label: 'Khách hàng', path: '/admin/customers' },
  { icon: ShoppingCart, label: 'Bán hàng', path: '/admin/sales' },
  { icon: Calculator, label: 'Sổ tài khoản', path: '/admin/accounts' },
  { icon: FileText, label: 'Sổ nhật ký', path: '/admin/journal' },
  { icon: BarChart3, label: 'Báo cáo', path: '/admin/reports' },
  { icon: Settings, label: 'Cấu hình Store', path: '/admin/settings' },
  { icon: Wrench, label: 'Sửa chữa', path: '/admin/repairs', disabled: true },
  { icon: Users, label: 'Tuyển dụng', path: '/admin/recruitment', disabled: true },
];

export function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-white border-r border-border flex flex-col shadow-sm" data-testid="admin-sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">OTNT ERP</h1>
            <p className="text-xs text-muted-foreground">Quản lý hệ thống</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu chính</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.disabled ? '#' : item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
              {item.disabled && <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Sớm</span>}
            </Link>
          );
        })}
      </nav>

      {/* Store Link */}
      <div className="p-4 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-muted/50 border border-border text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all"
          data-testid="nav-storefront"
        >
          <Store className="w-5 h-5" />
          <span>Xem Storefront</span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Link>
      </div>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{user?.full_name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          onClick={logout}
          data-testid="logout-button"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
