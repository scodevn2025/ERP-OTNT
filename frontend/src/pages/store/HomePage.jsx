import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Truck,
  Shield,
  Headphones,
  Gift
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { storeAPI } from '@/lib/api';
import { formatCurrency, PRODUCT_TYPES } from '@/lib/utils';

// Flash Sale Countdown Component
function FlashSaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 59, seconds: 58 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset countdown
          return { hours: 23, minutes: 59, seconds: 59 };
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <span className="bg-gray-900 text-white px-2 py-1 rounded font-mono font-bold text-lg min-w-[40px] text-center">
        {String(timeLeft.hours).padStart(2, '0')}
      </span>
      <span className="text-2xl font-bold text-gray-900">:</span>
      <span className="bg-gray-900 text-white px-2 py-1 rounded font-mono font-bold text-lg min-w-[40px] text-center">
        {String(timeLeft.minutes).padStart(2, '0')}
      </span>
      <span className="text-2xl font-bold text-gray-900">:</span>
      <span className="bg-gray-900 text-white px-2 py-1 rounded font-mono font-bold text-lg min-w-[40px] text-center">
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

// Product Card Component
function ProductCard({ product }) {
  const originalPrice = product.price * 1.3; // Simulated original price
  const discount = Math.round((1 - product.price / originalPrice) * 100);
  const savings = originalPrice - product.price;

  return (
    <Card className="group border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {/* Badge */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <Badge className="bg-red-500 text-white font-bold px-2 py-1">
              -{discount}%
            </Badge>
            {product.is_new && (
              <Badge className="bg-green-500 text-white font-bold px-2 py-1">
                MỚI
              </Badge>
            )}
          </div>
          
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[48px] group-hover:text-red-600 transition-colors text-sm">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm line-through">
                Giá gốc: {formatCurrency(originalPrice)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold text-lg">
                Giá KM: {formatCurrency(product.price)}
              </span>
            </div>
            <div className="text-green-600 text-xs font-medium">
              Tiết kiệm: {formatCurrency(savings)} (-{discount}%)
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button 
            className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold gap-2"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Thêm vào giỏ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Banner Slider Component
function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const banners = [
    {
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
      title: 'Robot hút bụi thông minh',
      subtitle: 'Giảm đến 40%'
    },
    {
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop',
      title: 'Công nghệ AI tiên tiến',
      subtitle: 'Miễn phí vận chuyển'
    },
    {
      image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1200&h=400&fit=crop',
      title: 'Bảo hành chính hãng',
      subtitle: 'Lên đến 24 tháng'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={index} className="w-full flex-shrink-0 relative">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
              <div className="text-white p-8 md:p-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-2">{banner.title}</h2>
                <p className="text-xl md:text-2xl text-red-400 font-semibold">{banner.subtitle}</p>
                <Button className="mt-4 bg-red-500 hover:bg-red-600">
                  Khám phá ngay
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === current ? 'bg-red-500 w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button 
        onClick={() => setCurrent(prev => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={() => setCurrent(prev => (prev + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await storeAPI.getProducts({ limit: 12 });
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const features = [
    { icon: Truck, title: 'Miễn phí vận chuyển', description: 'Đơn hàng từ 500K', color: 'bg-blue-500' },
    { icon: Shield, title: 'Bảo hành chính hãng', description: 'Lên đến 24 tháng', color: 'bg-green-500' },
    { icon: Headphones, title: 'Hỗ trợ 24/7', description: 'Tư vấn nhiệt tình', color: 'bg-purple-500' },
    { icon: Gift, title: 'Quà tặng hấp dẫn', description: 'Nhiều ưu đãi', color: 'bg-orange-500' },
  ];

  return (
    <div data-testid="home-page" className="bg-gray-50">
      {/* Banner Slider */}
      <section className="container mx-auto px-4 py-6">
        <BannerSlider />
      </section>

      {/* Features Bar */}
      <section className="container mx-auto px-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
              <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center flex-shrink-0`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale Section */}
      <section className="container mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-8 h-8 text-yellow-300" />
                <h2 className="text-2xl md:text-3xl font-bold">F⚡ASH SALE</h2>
              </div>
              <div className="hidden md:block text-white/80">
                Kết thúc trong
              </div>
              <FlashSaleCountdown />
            </div>
            <Link to="/products?sale=true">
              <Button variant="secondary" className="bg-white text-red-500 hover:bg-gray-100">
                Xem tất cả
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Flash Sale Products */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-xl h-64 animate-pulse" />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-white/80">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              products.slice(0, 6).map((product) => (
                <Link key={product.id} to={`/products/${product.slug}`}>
                  <ProductCard product={product} />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* All Products Section */}
      <section className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tất cả sản phẩm</h2>
            <div className="text-sm text-gray-500">
              Tìm thấy {products.length} sản phẩm
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có sản phẩm</h3>
              <p className="text-gray-500">Vui lòng quay lại sau</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map((product) => (
                  <Link key={product.id} to={`/products/${product.slug}`}>
                    <ProductCard product={product} />
                  </Link>
                ))}
              </div>

              {/* Load More Button */}
              <div className="text-center mt-8">
                <Link to="/products">
                  <Button variant="outline" size="lg" className="px-8">
                    Xem thêm sản phẩm
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Category Sections */}
      <section className="container mx-auto px-4 mb-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Robot Category */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-2xl font-bold mb-2">Robot Hút bụi - Lau nhà</h3>
            <p className="text-white/80 mb-4">Công nghệ AI, tự động 100%</p>
            <Link to="/products?type=robot">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Xem ngay
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Accessories Category */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-2xl font-bold mb-2">Phụ kiện chính hãng</h3>
            <p className="text-white/80 mb-4">Chổi, filter, giẻ lau...</p>
            <Link to="/products?type=accessory">
              <Button className="bg-white text-green-600 hover:bg-gray-100">
                Xem ngay
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter / CTA Section */}
      <section className="container mx-auto px-4 mb-8">
        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Đăng ký nhận tin khuyến mãi
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Nhận thông tin về sản phẩm mới và các chương trình giảm giá độc quyền
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <Button className="bg-red-500 hover:bg-red-600 px-8 rounded-full">
              Đăng ký
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
