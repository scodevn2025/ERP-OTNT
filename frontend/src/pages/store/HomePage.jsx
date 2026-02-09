import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ShoppingCart,
  ChevronRight,
  Truck,
  Shield,
  Zap,
  Star,
  Gift,
  Timer
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { storeAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useStore } from '@/contexts/StoreContext';

// --- Helpers ---
const DiscountBadge = ({ price, original }) => {
  if (!original || original <= price) return null;
  const percent = Math.round(((original - price) / original) * 100);
  return (
    <span className="absolute top-0 right-0 bg-yellow-400 text-red-700 font-bold text-xs px-2 py-1 rounded-bl-lg z-10 shadow-sm">
      -{percent}%
    </span>
  );
};

const ProductGridItem = ({ product }) => {
  const { settings } = useStore();
  const originalPrice = product.price * 1.25; // Sim
  return (
    <Link to={`/products/${product.slug}`} className="block h-full">
      <div className="bg-white border rounded-lg hover:shadow-lg transition-all duration-300 h-full flex flex-col relative group overflow-hidden">
        <DiscountBadge price={product.price} original={originalPrice} />
        <div className="p-4 aspect-square flex items-center justify-center relative">
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-gray-700 font-medium text-sm line-clamp-2 mb-2 h-10 hover:text-primary transition-colors" title={product.name}>
            {product.name}
          </h3>
          <div className="mt-auto">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-primary font-bold text-base md:text-lg leading-none">{formatCurrency(product.price)}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400 text-xs line-through">{formatCurrency(originalPrice)}</span>
            </div>
            {/* Rating Info */}
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2">
              <div className="flex text-yellow-400"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
              <span>(15)</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const SectionTitle = ({ title, link, icon }) => (
  <div className="flex items-center justify-between py-4 border-b-2 border-primary mb-4 bg-white px-0 md:px-0">
    <div className="flex items-center gap-2">
      <div className="bg-primary text-white p-1.5 rounded-sm">{icon}</div>
      <h2 className="text-lg md:text-xl font-bold text-gray-800 uppercase">{title}</h2>
    </div>
    {link && (
      <Link to={link} className="text-blue-600 text-sm hover:underline flex items-center font-medium">
        Xem tất cả <ChevronRight size={16} />
      </Link>
    )}
  </div>
);

// --- Sections ---

const SidebarMenu = () => {
  const menus = [
    { label: "Robot Hút Bụi Lau Nhà", icon: "🤖", link: "/products?type=robot" },
    { label: "Máy Hút Bụi Cầm Tay", icon: "🧹", link: "/products?type=goods" },
    { label: "Máy Lau Sàn Thông Minh", icon: "🧼", link: "/products?type=floor" },
    { label: "Robot Lau Kính", icon: "🪟", link: "/products?type=glass" },
    { label: "Máy Lọc Không Khí", icon: "☁️", link: "/products?type=air" },
    { label: "Phụ Kiện Chính Hãng", icon: "🔩", link: "/products?type=accessory" },
    { label: "Linh Kiện Thay Thế", icon: "🛠️", link: "/products?type=parts" },
    { label: "Dịch Vụ Sửa Chữa", icon: "🚑", link: "/services" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full py-2">
      {menus.map((m, i) => (
        <Link key={i} to={m.link} className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 hover:text-primary hover:font-bold text-gray-700 transition-all border-b border-gray-50 last:border-0 text-sm">
          <span className="text-lg w-6 text-center">{m.icon}</span>
          <span>{m.label}</span>
          <ChevronRight size={14} className="ml-auto opacity-30" />
        </Link>
      ))}
    </div>
  );
}

const MainBanner = () => {
  const { settings } = useStore();
  // Placeholder images matching context
  const defaultSlides = [
    "https://images.unsplash.com/photo-1589820296156-2454bb8a6d54?auto=format&fit=crop&q=80&w=1200&h=400",
    "https://images.unsplash.com/photo-1558317374-a3547dda1609?auto=format&fit=crop&q=80&w=1200&h=400"
  ];

  const slides = settings?.hero_banners?.length > 0
    ? settings.hero_banners.map(b => b.image_url)
    : defaultSlides;

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides]);

  return (
    <div className="relative h-[360px] md:h-[384px] rounded-lg overflow-hidden bg-gray-200">
      <img src={slides[current]} alt="Banner" className="w-full h-full object-cover transition-opacity duration-500" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === current ? 'bg-primary w-8' : 'bg-white w-2'}`} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await storeAPI.getProducts({ limit: 12 });
        setProducts(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <div className="bg-[#f4f6f8] pb-12">
      {/* Top Hero Section: Menu + Banner */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Left Sidebar Menu - Hidden on mobile, often used in VN ecommerce */}
          <div className="hidden md:block col-span-1">
            <SidebarMenu />
          </div>
          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-3">
            <MainBanner />
            {/* Small Sub-Banners under main banner */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="h-24 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-bold text-blue-800">Cam kết chính hãng</div>
              <div className="h-24 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-800">Bảo hành 24 tháng</div>
              <div className="h-24 bg-orange-100 rounded-lg flex items-center justify-center text-xs font-bold text-orange-800">Lỗi 1 đổi 1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature: Flash Sale (Red Background) */}
      <div className="bg-primary py-6 mb-8 mt-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4 text-white">
            <div className="bg-white/20 p-2 rounded-full"><Zap className="text-yellow-300 fill-yellow-300 animate-pulse" /></div>
            <h2 className="text-2xl font-black italic uppercase tracking-wider">F⚡ASH SALE</h2>
            <div className="bg-black/30 px-3 py-1 rounded text-sm font-mono">02 : 12 : 45</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {loading ? [1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 bg-white/10 rounded-lg" />) :
              products.slice(0, 5).map(p => (
                <div key={p.id} className="bg-white rounded-lg p-2 hover:translate-y-[-2px] transition-transform">
                  <ProductGridItem product={p} />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Category: Robot Hut Bui */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Vertical Banner on Left? (Optional) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-blue-600 h-full rounded-lg text-white p-6 flex flex-col justify-between">
              <h3 className="text-3xl font-bold">ROBOT<br />HÚT BỤI</h3>
              <div className="space-y-2 mt-4">
                <Link to="#" className="block hover:underline opacity-90">Dreame</Link>
                <Link to="#" className="block hover:underline opacity-90">Roborock</Link>
                <Link to="#" className="block hover:underline opacity-90">Ecovacs</Link>
              </div>
              <Button className="mt-8 bg-white text-blue-600 hover:bg-blue-50">Xem tất cả</Button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1">
            <SectionTitle title="Robot Hút Bụi Thông Minh" icon={<Zap size={18} fill="white" />} link="/products?type=robot" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {loading ? [1, 2, 3, 4].map(i => <div key={i} className="h-72 bg-gray-200 rounded" />) :
                products.map(p => (
                  <ProductGridItem key={p.id} product={p} />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Big Banner Middle */}
      <div className="container mx-auto px-4 mb-8">
        <div className="h-32 md:h-48 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          QUẢNG CÁO: DREAME X40 ULTRA - VUA ROBOT 2026
        </div>
      </div>

      {/* Category: May Hut Bui Cam Tay */}
      <div className="container mx-auto px-4 mb-8">
        <SectionTitle title="Máy Hút Bụi Cầm Tay" icon={<Star size={18} fill="white" />} link="/products?type=goods" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {products.slice(0, 5).map(p => (
            <ProductGridItem key={'h' + p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
