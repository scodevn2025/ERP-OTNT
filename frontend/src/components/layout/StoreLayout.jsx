import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  ShoppingCart,
  Menu,
  Phone,
  Search,
  User,
  Heart,
  ChevronRight,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Zap,
  ChevronDown,
  Star
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { storeAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from '@/contexts/StoreContext';

export function StoreLayout({ children }) {
  const { user, logout } = useAuth();
  const { settings, loading: settingsLoading } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (settingsLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Define menu items for the sidebar/navbar
  const menuItems = [
    { label: "Robot hút bụi lau nhà", path: "/products?type=robot", icon: "🤖" },
    { label: "Máy hút bụi cầm tay", path: "/products?type=goods", icon: "🧹" },
    { label: "Máy lọc không khí", path: "/products?type=air", icon: "💨" },
    { label: "Robot lau kính", path: "/products?type=glass", icon: "🪟" },
    { label: "Phụ kiện & Linh kiện", path: "/products?type=accessory", icon: "⚙️" },
    { label: "Dịch vụ sửa chữa", path: "/services", icon: "🔧" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans text-sm">
      {/* Top Banner (Optional Promo) */}
      <div className="bg-yellow-400 text-red-700 text-xs font-bold py-1 text-center hidden sm:block">
        SIÊU SALE THÁNG 6 - GIẢM ĐẾN 50% TOÀN BỘ ROBOT HÚT BỤI - MUA NGAY!
      </div>

      {/* Top Header Information */}
      <div className="bg-red-700 text-white py-1 text-xs border-b border-red-800">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 opacity-90 hover:opacity-100 cursor-pointer"><Phone size={12} /> {settings.contact_phone}</span>
            <span className="flex items-center gap-1 opacity-90 hover:opacity-100 cursor-pointer"><MapPin size={12} /> Hệ thống cửa hàng</span>
          </div>
          <div className="flex gap-3">
            <a href="#" className="opacity-90 hover:opacity-100">Tin công nghệ</a>
            <a href="#" className="opacity-90 hover:opacity-100">Tuyển dụng</a>
            <a href="#" className="opacity-90 hover:opacity-100">Liên hệ</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-red-600 text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary font-black text-2xl shadow-sm italic">
                {settings.site_name.charAt(0)}
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-xl tracking-tight uppercase">{settings.site_name}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-90">{settings.tagline}</span>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Bạn cần tìm gì? (Ví dụ: Dreame L10s Ultra...)"
                  className="w-full h-10 pl-4 pr-12 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-0 top-0 h-10 w-12 bg-gray-800 hover:bg-gray-900 text-white rounded-r-lg flex items-center justify-center transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <Link to="/cart" className="flex flex-col items-center group relative p-1">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 text-red-700 text-[10px] font-bold flex items-center justify-center">0</span>
                </div>
                <span className="text-[10px] mt-1 opacity-90 group-hover:opacity-100 hidden sm:block">Giỏ hàng</span>
              </Link>

              <div className="h-8 w-[1px] bg-white/20 hidden sm:block"></div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex flex-col items-center cursor-pointer group p-1">
                      <User size={24} />
                      <span className="text-[10px] mt-1 opacity-90 group-hover:opacity-100 hidden sm:block truncate max-w-[60px]">{user.full_name}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(user.role === 'admin' || user.role === 'manager') && <DropdownMenuItem><Link to="/admin">Trang Quản Trị</Link></DropdownMenuItem>}
                    <DropdownMenuItem onClick={logout}>Đăng xuất</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login" className="flex flex-col items-center group p-1">
                  <User size={24} />
                  <span className="text-[10px] mt-1 opacity-90 group-hover:opacity-100 hidden sm:block">Đăng nhập</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sub-Header / Navigation (Visible on all pages? Or just Home?) */}
      {/* Usually hidden on scroll, but kept simple here */}
      <div className="bg-white border-b shadow-sm hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 py-3 px-4 bg-gray-100 font-bold text-gray-700 cursor-pointer hover:bg-gray-200 rounded-t-none w-[260px]">
              <Menu size={18} />
              DANH MỤC SẢN PHẨM
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-gray-600 overflow-x-auto">
              {/* Horizontal Links for quick access */}
              <Link to="/products?tag=flash-sale" className="flex items-center gap-1 hover:text-red-600 whitespace-nowrap"><Zap size={14} className="text-yellow-500 fill-yellow-500" /> Flash Sale</Link>
              <Link to="/products?type=robot" className="hover:text-red-600 whitespace-nowrap">Robot Hút Bụi</Link>
              <Link to="/products?type=goods" className="hover:text-red-600 whitespace-nowrap">Máy Cầm Tay</Link>
              <Link to="/news" className="hover:text-red-600 whitespace-nowrap">Tin Tức</Link>
              <Link to="/contact" className="hover:text-red-600 whitespace-nowrap">Liên Hệ</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <main className="min-h-[600px]">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-white pt-10 border-t border-gray-200 mt-8 text-gray-700">
        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary uppercase">{settings.site_name}</h3>
              <p className="text-sm mb-4 leading-relaxed">
                {settings.tagline}. Hệ thống phân phối thông minh chính hãng uy tín nhất Việt Nam.
              </p>
              <div className="flex gap-2">
                <span className="p-2 bg-blue-600 text-white rounded-full"><Facebook size={16} /></span>
                <span className="p-2 bg-pink-600 text-white rounded-full"><Instagram size={16} /></span>
                <span className="p-2 bg-red-600 text-white rounded-full"><Youtube size={16} /></span>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">VỀ CHÚNG TÔI</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="#" className="hover:text-red-600">Giới thiệu công ty</Link></li>
                <li><Link to="#" className="hover:text-red-600">Hệ thống cửa hàng</Link></li>
                <li><Link to="#" className="hover:text-red-600">Tuyển dụng</Link></li>
                <li><Link to="#" className="hover:text-red-600">Chính sách bảo mật</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">HỖ TRỢ KHÁCH HÀNG</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="#" className="hover:text-red-600">Hướng dẫn mua hàng</Link></li>
                <li><Link to="#" className="hover:text-red-600">Chính sách bảo hành</Link></li>
                <li><Link to="#" className="hover:text-red-600">Chính sách đổi trả</Link></li>
                <li><Link to="#" className="hover:text-red-600">Chính sách vận chuyển</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase">LIÊN HỆ</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2"><MapPin size={16} className="text-primary shrink-0" /> <span>{settings.address}</span></li>
                <li className="flex gap-2"><Phone size={16} className="text-primary shrink-0" /> <span className="font-bold text-primary">{settings.contact_phone}</span></li>
                <li className="flex gap-2"><span className="text-primary font-bold shrink-0">@</span> <span>{settings.contact_email}</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {settings.site_name}. All rights reserved.
        </div>
      </footer>

      {/* Mobile Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 md:hidden flex justify-between items-center z-50 text-[10px] text-gray-500">
        <Link to="/" className="flex flex-col items-center text-red-600"><div className="mb-1"><Menu size={20} /></div>Trang chủ</Link>
        <Link to="/products" className="flex flex-col items-center"><div className="mb-1"><Search size={20} /></div>Tìm kiếm</Link>
        <Link to="/cart" className="flex flex-col items-center"><div className="mb-1 relative"><ShoppingCart size={20} /><span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"></span></div>Giỏ hàng</Link>
        <Link to="/user" className="flex flex-col items-center"><div className="mb-1"><User size={20} /></div>Tài khoản</Link>
      </div>
    </div>
  );
}

import { Outlet } from 'react-router-dom';
