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
  Image,
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
  { icon: FileText, label: 'Bài viết (Blog)', path: '/admin/blogs' },
  { icon: Settings, label: 'Cấu hình Store', path: '/admin/settings' },
  { icon: Users, label: 'Quản lý nhân viên', path: '/admin/users' },
  { icon: Image, label: 'Quản lý Media', path: '/admin/media' },
  { icon: Wrench, label: 'Sửa chữa', path: '/admin/repairs', disabled: true },
];

export function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-white border-r border-border flex flex-col shadow-sm" data-testid="admin-sidebar">
      {/* Logo */}
      <div className="p-6">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ee2d24] flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-extrabold tracking-tight text-gray-900 uppercase">OTNT ERP</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Quản lý hệ thống</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.disabled ? '#' : item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group',
                isActive
                  ? 'bg-red-50/80 text-[#ee2d24] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                item.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-[#ee2d24]" : "text-gray-400 group-hover:text-gray-600")} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#ee2d24]" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100 mb-2">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border border-red-200">
            <span className="text-sm font-bold text-[#ee2d24]">{user?.full_name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-gray-900">{user?.full_name || 'Admin User'}</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{user?.role || 'Admin'}</p>
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
