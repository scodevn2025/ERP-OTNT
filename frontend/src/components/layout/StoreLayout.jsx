import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from 'sonner';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  X, 
  LayoutDashboard,
  Phone,
  Truck,
  Shield,
  ChevronDown,
  MapPin,
  Mail,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function StoreLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Sản phẩm', path: '/products' },
    { label: 'Robot hút bụi', path: '/products?type=robot' },
    { label: 'Phụ kiện', path: '/products?type=accessory' },
    { label: 'Liên hệ', path: '/contact' },
  ];

  const popularSearches = [
    'Dreame X40 Ultra',
    'Roborock S8',
    'Ecovacs X2',
    'Tineco S7'
  ];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="store-layout">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>Miễn phí vận chuyển toàn quốc</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Bảo hành chính hãng 12 tháng</span>
              </div>
            </div>
            <a href="tel:0826123678" className="flex items-center gap-2 font-semibold hover:text-yellow-300 transition-colors">
              <Phone className="w-4 h-4" />
              <span>0826.123.678</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">O</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-gray-900 leading-tight">OTNT VIETNAM</h1>
                <p className="text-xs text-gray-500">Robot hút bụi chính hãng</p>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-4 pr-12 rounded-full border-2 border-gray-200 focus:border-red-500 bg-gray-50"
                />
                <Button 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-red-500 hover:bg-red-600 h-9 w-9"
                >
                  <Search className="w-4 h-4 text-white" />
                </Button>
              </div>
              {/* Popular Searches */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-gray-500">🔥 Tìm kiếm phổ biến:</span>
                {popularSearches.map((term, i) => (
                  <Link 
                    key={i} 
                    to={`/products?search=${encodeURIComponent(term)}`}
                    className="text-red-600 hover:text-red-700 hover:underline"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="w-5 h-5" />
              </Button>
              
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    0
                  </span>
                </Button>
              </Link>
              
              {user ? (
                <div className="flex items-center gap-2">
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-red-500 text-red-500 hover:bg-red-50">
                        <LayoutDashboard className="w-4 h-4" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={logout} data-testid="store-logout">
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button size="sm" className="gap-2 bg-red-500 hover:bg-red-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Đăng nhập</span>
                  </Button>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 py-2 border-t border-gray-100">
            <Button variant="ghost" className="gap-2 text-red-600 font-semibold">
              <Menu className="w-4 h-4" />
              DANH MỤC
              <ChevronDown className="w-4 h-4" />
            </Button>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  location.pathname === link.path
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full h-10 pl-4 pr-10 rounded-full border-gray-200"
                />
                <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[60vh]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <span className="text-xl font-bold">O</span>
                </div>
                <h3 className="font-bold text-lg">OTNT VIETNAM</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Chuyên cung cấp robot hút bụi, máy lau nhà thông minh chính hãng từ các thương hiệu hàng đầu thế giới.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Liên hệ</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span>Hotline: 0826.123.678</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  <span>Email: support@otnt.vn</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Hà Nội, Việt Nam</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>8:00 - 21:00 hàng ngày</span>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Danh mục</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/products?type=robot" className="hover:text-red-500 transition-colors">Robot hút bụi</Link></li>
                <li><Link to="/products?type=goods" className="hover:text-red-500 transition-colors">Gia dụng thông minh</Link></li>
                <li><Link to="/products?type=accessory" className="hover:text-red-500 transition-colors">Phụ kiện</Link></li>
                <li><Link to="/products?type=part" className="hover:text-red-500 transition-colors">Linh kiện thay thế</Link></li>
                <li><Link to="/products?type=service" className="hover:text-red-500 transition-colors">Dịch vụ sửa chữa</Link></li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Chính sách</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-red-500 transition-colors">Chính sách bảo hành</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Chính sách đổi trả</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Chính sách vận chuyển</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Hướng dẫn mua hàng</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Điều khoản sử dụng</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 OTNT Vietnam. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}
