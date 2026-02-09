import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Zap,
  FileText,
  Search,
  Phone,
  Truck,
  Shield,
  Gift,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { storeAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useStore } from '@/contexts/StoreContext';

// --- Brand Logos ---
const BRANDS = [
  { name: 'Dreame', slug: 'dreame', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Dreame_logo.svg/200px-Dreame_logo.svg.png' },
  { name: 'Roborock', slug: 'roborock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Roborock_logo.svg/200px-Roborock_logo.svg.png' },
  { name: 'Ecovacs', slug: 'ecovacs', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ecovacs_logo.svg/200px-Ecovacs_logo.svg.png' },
  { name: 'Tineco', slug: 'tineco', logo: 'https://cdn.shopify.com/s/files/1/0549/5190/4653/files/tineco-logo.png?v=1614816546' },
  { name: 'Xiaomi', slug: 'xiaomi', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/200px-Xiaomi_logo.svg.png' },
];

// --- Popular Searches ---
const POPULAR_SEARCHES = [
  'Dreame X50 Ultra',
  'Dreame X40 Ultra',
  'Roborock S8 Pro',
  'Dreame L40 Ultra',
  'Ecovacs X2 Omni',
];

// --- Product Card Component ---
const ProductCard = ({ product }) => {
  const originalPrice = product.price * 1.25;
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

  return (
    <Link to={`/products/${product.slug}`} className="group block h-full">
      <div className="bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-red-500 text-white font-bold text-xs px-2 py-1 rounded-md border-none">
              -{discount}%
            </Badge>
          </div>
        )}

        {/* Product Image */}
        <div className="relative aspect-square p-4 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[40px]">
            {product.name}
          </h3>

          <div className="mt-auto space-y-2">
            {/* Original Price */}
            <div className="text-gray-400 text-xs line-through">
              {formatCurrency(originalPrice)}
            </div>

            {/* Sale Price */}
            <div className="text-primary font-black text-lg">
              {formatCurrency(product.price)}
            </div>

            {/* Quick Add Button */}
            <Button
              className="w-full bg-primary hover:bg-red-700 text-white font-bold rounded-lg py-2 text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to cart
              }}
            >
              <ShoppingCart size={14} />
              Mua ngay
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- Horizontal Scroll Section ---
const ProductCarousel = ({ title, products, icon, loading, link }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [products]);

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-primary">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white p-2 rounded-lg">
            {icon}
          </div>
          <h2 className="text-lg md:text-xl font-black text-gray-800 uppercase tracking-tight">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              "p-2 rounded-full border transition-all",
              canScrollLeft
                ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                : "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              "p-2 rounded-full border transition-all",
              canScrollRight
                ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                : "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
            )}
          >
            <ChevronRight size={20} />
          </button>
          {link && (
            <Link to={link} className="text-primary text-sm font-semibold hover:underline flex items-center ml-2">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Products Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] md:w-[220px]">
              <div className="bg-gray-100 rounded-xl h-[320px] animate-pulse" />
            </div>
          ))
        ) : (
          products.map(product => (
            <div key={product.id} className="flex-shrink-0 w-[200px] md:w-[220px] relative">
              <ProductCard product={product} />
            </div>
          ))
        )}
      </div>
    </section>
  );
};

// --- Hero Banner Slider ---
const HeroBanner = () => {
  const { settings } = useStore();
  const [current, setCurrent] = useState(0);

  const defaultSlides = [
    { image: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6d54?auto=format&fit=crop&q=80&w=1400&h=500', title: 'Robot Hút Bụi Cao Cấp' },
    { image: 'https://images.unsplash.com/photo-1558317374-a3547dda1609?auto=format&fit=crop&q=80&w=1400&h=500', title: 'Ưu Đãi Đặc Biệt' }
  ];

  const slides = settings?.hero_banners?.length > 0
    ? settings.hero_banners.map(b => ({ image: b.image_url, title: b.title || '' }))
    : defaultSlides;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative h-[280px] md:h-[420px] rounded-2xl overflow-hidden shadow-2xl">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-all duration-1000",
            i === current ? "opacity-100 scale-100" : "opacity-0 scale-110"
          )}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === current ? "bg-white w-8" : "bg-white/50 w-2 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );
};

// --- Popular Searches Section ---
const PopularSearches = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 mb-3">
      <Search size={16} className="text-primary" />
      <span className="font-bold text-sm text-gray-700">Tìm kiếm phổ biến</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {POPULAR_SEARCHES.map((term, i) => (
        <Link
          key={i}
          to={`/products?search=${encodeURIComponent(term)}`}
          className="px-3 py-1.5 bg-gray-50 hover:bg-primary hover:text-white text-gray-600 text-xs font-medium rounded-full transition-colors border border-gray-100"
        >
          {term}
        </Link>
      ))}
    </div>
  </div>
);

// --- Brand Section ---
const BrandSection = () => (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-primary">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-white p-2 rounded-lg">
          <Gift size={18} />
        </div>
        <h2 className="text-lg md:text-xl font-black text-gray-800 uppercase tracking-tight">
          Thương hiệu nổi bật
        </h2>
      </div>
    </div>

    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
      {BRANDS.map((brand) => (
        <Link
          key={brand.slug}
          to={`/products?brand=${brand.slug}`}
          className="bg-white rounded-xl p-6 border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all flex items-center justify-center group"
        >
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-8 md:h-10 object-contain grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100"
          />
        </Link>
      ))}
    </div>
  </section>
);

// --- Service Features ---
const ServiceFeatures = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
    {[
      { icon: <Truck size={24} />, title: 'Giao hàng miễn phí', desc: 'Đơn từ 500K' },
      { icon: <Shield size={24} />, title: 'Bảo hành chính hãng', desc: '12-24 tháng' },
      { icon: <RefreshCw size={24} />, title: 'Đổi trả dễ dàng', desc: 'Trong 7 ngày' },
      { icon: <Phone size={24} />, title: 'Hỗ trợ 24/7', desc: '0826.123.678' },
    ].map((item, i) => (
      <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow">
        <div className="text-primary">{item.icon}</div>
        <div>
          <div className="font-bold text-sm text-gray-800">{item.title}</div>
          <div className="text-xs text-gray-500">{item.desc}</div>
        </div>
      </div>
    ))}
  </div>
);

// --- Blog Section ---
const BlogSection = ({ blogs, loading }) => (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-primary">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-white p-2 rounded-lg">
          <FileText size={18} />
        </div>
        <h2 className="text-lg md:text-xl font-black text-gray-800 uppercase tracking-tight">
          Tin tức & Hướng dẫn
        </h2>
      </div>
      <Link to="/blog" className="text-primary text-sm font-semibold hover:underline flex items-center">
        Xem tất cả <ChevronRight size={16} />
      </Link>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-[280px] animate-pulse" />
        ))
      ) : blogs.length === 0 ? (
        <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed text-gray-400">
          <FileText className="mx-auto mb-3 opacity-30" size={40} />
          Chưa có bài viết nào
        </div>
      ) : (
        blogs.map(blog => (
          <Link key={blog.id} to={`/blog/${blog.slug}`} className="group">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all h-full flex flex-col">
              <div className="aspect-video overflow-hidden relative">
                <img
                  src={blog.feature_image || 'https://via.placeholder.com/400x225'}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <Badge className="absolute top-2 left-2 bg-primary/90 border-none text-[10px]">
                  {blog.category === 'guide' ? 'Hướng dẫn' : blog.category === 'promo' ? 'Khuyến mãi' : 'Tin tức'}
                </Badge>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 text-sm group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-2 flex-1">
                  {blog.excerpt || 'Đọc thêm chi tiết...'}
                </p>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  </section>
);

// --- Main HomePage Component ---
export default function HomePage() {
  const { settings } = useStore();
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, bRes] = await Promise.all([
          storeAPI.getProducts({ limit: 20 }),
          storeAPI.getBlogs({ limit: 4 })
        ]);
        setProducts(pRes.data || []);
        setBlogs(bRes.data || []);
      } catch (e) {
        console.error('Failed to fetch data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Split products for different sections
  const newProducts = products.slice(0, 10);
  const robotProducts = products.filter(p => p.product_type === 'robot').slice(0, 10);
  const accessoryProducts = products.filter(p => p.product_type === 'accessory' || p.product_type === 'goods').slice(0, 10);

  return (
    <div className="bg-[#f5f5f7] min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-primary text-white px-4 py-3 font-bold flex items-center gap-2">
                <Zap size={18} />
                DANH MỤC SẢN PHẨM
              </div>
              <nav className="py-2">
                {[
                  { label: 'Robot Hút Bụi Lau Nhà', icon: '🤖', link: '/products?type=robot' },
                  { label: 'Máy Hút Bụi Cầm Tay', icon: '🧹', link: '/products?type=goods' },
                  { label: 'Máy Lau Sàn', icon: '🧼', link: '/products?type=floor' },
                  { label: 'Robot Lau Kính', icon: '🪟', link: '/products?type=glass' },
                  { label: 'Máy Lọc Không Khí', icon: '☁️', link: '/products?type=air' },
                  { label: 'Phụ Kiện Chính Hãng', icon: '🔩', link: '/products?type=accessory' },
                  { label: 'Linh Kiện Thay Thế', icon: '🛠️', link: '/products?type=parts' },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.link}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 hover:text-primary text-gray-700 transition-colors text-sm border-b border-gray-50 last:border-0"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight size={14} className="ml-auto opacity-30" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Hotline Box */}
            <div className="mt-4 bg-gradient-to-r from-primary to-red-600 rounded-xl p-4 text-white text-center">
              <Phone size={24} className="mx-auto mb-2" />
              <div className="text-xs opacity-90 mb-1">HOTLINE TƯ VẤN</div>
              <a href={`tel:${settings?.contact_phone || '0826123678'}`} className="text-xl font-black tracking-tight">
                {settings?.contact_phone || '0826.123.678'}
              </a>
            </div>
          </div>

          {/* Main Banner Area */}
          <div className="lg:col-span-3 space-y-4">
            <HeroBanner />
            <PopularSearches />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {/* Service Features */}
        <ServiceFeatures />

        {/* New Products Carousel */}
        <ProductCarousel
          title="Sản phẩm mới"
          products={newProducts.length > 0 ? newProducts : products}
          icon={<Zap size={18} />}
          loading={loading}
          link="/products"
        />

        {/* Robot Vacuum Carousel */}
        {robotProducts.length > 0 && (
          <ProductCarousel
            title="Robot Hút Bụi Lau Nhà"
            products={robotProducts}
            icon={<Zap size={18} />}
            loading={loading}
            link="/products?type=robot"
          />
        )}

        {/* Brand Section */}
        <BrandSection />

        {/* Accessories Carousel */}
        {accessoryProducts.length > 0 && (
          <ProductCarousel
            title="Máy Hút Bụi & Phụ Kiện"
            products={accessoryProducts}
            icon={<Gift size={18} />}
            loading={loading}
            link="/products?type=accessory"
          />
        )}

        {/* Blog Section */}
        <BlogSection blogs={blogs} loading={loading} />
      </div>
    </div>
  );
}
