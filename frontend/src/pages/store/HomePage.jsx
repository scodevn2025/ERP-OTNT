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
  Timer,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const percent = original && original > price ? Math.round(((original - price) / original) * 100) : 0;
  return (
    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
      <span className="bg-[#10b981] text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow-sm scale-90 origin-left uppercase">
        MỚI
      </span>
      {percent > 0 && (
        <span className="bg-[#ee2d24] text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow-sm scale-90 origin-left whitespace-nowrap">
          -{percent}%
        </span>
      )}
    </div>
  );
};

const ProductGridItem = ({ product }) => {
  const originalPrice = product.price * 1.35; // Mock original price
  const discountAmount = originalPrice - product.price;
  const discountPercent = Math.round((discountAmount / originalPrice) * 100);

  return (
    <div className="bg-white border-0 hover:shadow-2xl transition-all duration-500 rounded-2xl flex flex-col relative group overflow-hidden h-full">
      <DiscountBadge price={product.price} original={originalPrice} />
      <div className="p-4 aspect-square flex items-center justify-center relative bg-[#f8fafc]">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700 p-4"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-gray-800 font-bold text-sm line-clamp-2 mb-3 leading-snug group-hover:text-primary transition-colors min-h-[40px]">
          {product.name}
        </h3>
        <div className="space-y-1 mb-4">
          <div className="text-gray-400 text-xs flex items-center gap-1">
            Giá gốc: <span className="line-through">{formatCurrency(originalPrice)}</span>
          </div>
          <div className="text-[#ee2d24] font-black text-base lg:text-lg flex items-center gap-1">
            Giá KM: <span>{formatCurrency(product.price)}</span>
          </div>
          <div className="text-[#10b981] font-bold text-[10px] lg:text-xs">
            Tiết kiệm: {formatCurrency(discountAmount)} (-{discountPercent}%)
          </div>
        </div>
        <Button className="w-full bg-[#ee2d24] hover:bg-red-700 text-white font-bold rounded-xl py-5 shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2">
          <ShoppingCart size={16} fill="white" />
          THÊM VÀO GIỎ
        </Button>
      </div>
    </div>
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
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides]);

  return (
    <div className="relative h-[300px] md:h-[450px] rounded-xl overflow-hidden shadow-xl group">
      {slides.map((src, i) => (
        <img
          key={i}
          src={src}
          alt="Banner"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out",
            i === current ? "opacity-100 scale-100" : "opacity-0 scale-110"
          )}
        />
      ))}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/60'}`}
          />
        ))}
      </div>
      {/* Gradient Overlay for better text visibility if any */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </div>
  );
}

const BlogCard = ({ blog }) => (
  <Link to={`/blog/${blog.slug}`} className="group h-full">
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={blog.feature_image || 'https://via.placeholder.com/400x225'}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm border-none">
          {blog.category === 'guide' ? 'Hướng dẫn' : blog.category === 'promo' ? 'Khuyến mãi' : 'Tin tức'}
        </Badge>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {blog.title}
        </h3>
        <p className="text-gray-500 text-xs mb-4 line-clamp-2 flex-1">
          {blog.excerpt || 'Đọc thêm chi tiết về bài viết này tại website...'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          <span>{new Date(blog.created_at).toLocaleDateString('vi-VN')}</span>
          <span className="flex items-center gap-1"><Timer size={10} /> {blog.view_count || 0} lượt xem</span>
        </div>
      </div>
    </div>
  </Link>
);

const FlashSaleCountdown = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    if (!endTime) return;
    const updateTimer = () => {
      const target = new Date(endTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ h: '00', m: '00', s: '00' });
        return false;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0')
      });
      return true;
    };

    updateTimer();
    const timer = setInterval(() => {
      if (!updateTimer()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="flex gap-2 items-center">
      <div className="bg-black text-white px-2 py-1 rounded-md text-xl font-black shadow-lg border border-white/20 min-w-[40px] text-center">{timeLeft.h}</div>
      <span className="text-white font-black text-2xl">:</span>
      <div className="bg-black text-white px-2 py-1 rounded-md text-xl font-black shadow-lg border border-white/20 min-w-[40px] text-center">{timeLeft.m}</div>
      <span className="text-white font-black text-2xl">:</span>
      <div className="bg-black text-white px-2 py-1 rounded-md text-xl font-black shadow-lg border border-white/20 min-w-[40px] text-center">{timeLeft.s}</div>
    </div>
  );
};

export default function HomePage() {
  const { settings } = useStore();
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, bRes] = await Promise.all([
          storeAPI.getProducts({ limit: 12 }),
          storeAPI.getBlogs({ limit: 4 })
        ]);
        setProducts(pRes.data || []);
        setBlogs(bRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const promoItems = settings?.promo_sections?.length > 0
    ? settings.promo_sections.slice(0, 3)
    : [
      { tag: "GIÁ TỐT", title: "Cam kết chính hãng", image_url: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=200&fit=crop", link: "#" },
      { tag: "DỊCH VỤ", title: "Bảo hành 24 tháng", image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=200&fit=crop", link: "#" },
      { tag: "UÝ TÍN", title: "Lỗi 1 đổi 1", image_url: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=400&h=200&fit=crop", link: "#" }
    ];

  return (
    <div className="bg-[#f8fafc] pb-16">
      {/* Top Hero Section: Menu + Banner */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar Menu */}
          <div className="hidden lg:block col-span-1">
            <SidebarMenu />
            <div className="mt-6 bg-white rounded-xl border border-dashed border-primary/30 p-4 text-center">
              <p className="text-sm font-bold text-primary italic mb-1">HOTLINE TƯ VẤN</p>
              <a href={`tel:${settings?.contact_phone}`} className="text-xl font-black text-gray-800 tracking-tight hover:text-primary transition-colors">
                {settings?.contact_phone || "0826.123.678"}
              </a>
            </div>
          </div>
          {/* Main Content Area */}
          <div className="col-span-1 lg:col-span-3 space-y-4">
            <MainBanner />
            {/* 3-Grid Promo Banners */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promoItems.map((promo, i) => (
                <Link key={i} to={promo.link} className="relative h-28 md:h-32 rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                  <img src={promo.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <Badge variant="secondary" className="w-fit text-[10px] h-4 mb-1 bg-white/90 text-primary font-bold border-none">{promo.tag || "ƯU ĐÃI"}</Badge>
                    <p className="text-white font-bold text-sm drop-shadow-md">{promo.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature: Flash Sale */}
      {settings?.flash_sale?.is_active && products.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-primary to-orange-500 py-8 mb-12 shadow-inner">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4 text-white">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-lg border border-white/30">
                  <Zap className="text-yellow-300 fill-yellow-300 w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{settings?.flash_sale?.title || "FLASH SALE"}</h2>
                  <p className="text-white/80 text-xs font-medium uppercase mt-1">Kết thúc sau:</p>
                </div>
                <FlashSaleCountdown endTime={settings?.flash_sale?.end_time} />
              </div>
              <Button variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-primary font-bold rounded-full px-8 h-12 shadow-lg backdrop-blur-md">
                XEM TẤT CẢ <ChevronRight className="ml-2" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {loading ? [1, 2, 3, 4, 5].map(i => <div key={i} className="h-72 bg-white/10 rounded-2xl animate-pulse" />) :
                products.slice(0, 5).map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-2 hover:translate-y-[-4px] transition-all duration-300 shadow-md">
                    <ProductGridItem product={p} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Category: Robot Hut Bui */}
      <div className="container mx-auto px-4 mb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Vertical Aesthetic Banner */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1589820296156-2454bb8a6d54?w=400&h=800&fit=crop"
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent flex flex-col justify-end p-8 text-white">
                <h3 className="text-4xl font-black mb-4 leading-none uppercase italic">ROBOT<br />HÚT BỤI<br />TRÙM</h3>
                <p className="text-white/80 text-sm mb-8 leading-relaxed">Bộ sưu tập robot hút bụi cao cấp nhất năm 2026 dành cho gia đình bạn.</p>
                <Button className="bg-white text-primary hover:bg-gray-100 font-bold rounded-xl h-12">MUA NGAY</Button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1">
            <SectionTitle title="MÁY HÚT BỤI - LAU SÀN" icon={<Zap size={18} fill="white" />} link="/products?type=robot" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? [1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-gray-200 rounded-xl" />) :
                products.map(p => (
                  <ProductGridItem key={p.id} product={p} />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <div className="container mx-auto px-4 mb-8">
        <SectionTitle title="TIN TỨC & HƯỚNG DẪN" icon={<FileText size={18} fill="white" />} link="/blog" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogs.length === 0 && !loading ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed text-gray-400">
              <FileText className="mx-auto mb-4 opacity-20" size={48} />
              Chưa có bài viết nào
            </div>
          ) : (
            blogs.map(blog => (
              <BlogCard key={blog.id} blog={blog} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
