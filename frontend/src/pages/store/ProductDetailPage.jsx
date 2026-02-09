import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storeAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart,
  Check,
  Truck,
  Phone,
  Minus,
  Plus,
  ChevronRight,
  ChevronLeft,
  Star,
  Zap,
  Camera,
  X,
  Eye,
  Shield,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, PRODUCT_TYPES, cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';

// --- Suggested Product Card ---
const SuggestedProductCard = ({ product }) => {
  const originalPrice = product.price * 1.25;
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden">
        {/* Product Image */}
        <div className="relative aspect-square p-3 bg-gray-50">
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold border-none">
              -{discount}%
            </Badge>
          )}
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/200'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[40px]">
            {product.name}
          </h3>
          <div className="text-xs text-gray-400 line-through">{formatCurrency(originalPrice)}</div>
          <div className="text-primary font-bold">{formatCurrency(product.price)}</div>
          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Còn hàng
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem, setIsOpen } = useCart();
  const [product, setProduct] = useState(null);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('Đen');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);

  // Simulated colors for demo
  const colors = [
    { name: 'Đen', code: '#1a1a1a' },
    { name: 'Trắng', code: '#f5f5f5' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, productsRes] = await Promise.all([
          storeAPI.getProduct(slug),
          storeAPI.getProducts({ limit: 10 })
        ]);
        setProduct(productRes.data);
        // Filter out current product from suggestions
        const filtered = (productsRes.data || []).filter(p => p.slug !== slug);
        setSuggestedProducts(filtered.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [slug]);

  const originalPrice = product?.price ? product.price * 1.4 : 0;
  const discount = product?.price ? Math.round((1 - product.price / originalPrice) * 100) : 0;

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity, selectedColor);
      setIsOpen(true);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity, selectedColor);
      // Navigate to checkout
      window.location.href = '/checkout';
    }
  };

  const nextImage = () => {
    if (product?.images?.length > 0) {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 0) {
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f5f5f7] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse" />
                <div className="h-12 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="h-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#f5f5f7] min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-gray-500 mb-6">Sản phẩm này không tồn tại hoặc đã bị xóa</p>
          <Link to="/products">
            <Button className="bg-primary hover:bg-red-600">Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f7] min-h-screen" data-testid="product-detail-page">
      {/* Image Zoom Modal */}
      {imageZoom && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setImageZoom(false)}>
          <button className="absolute top-4 right-4 text-white hover:text-red-500">
            <X className="w-8 h-8" />
          </button>
          <img
            src={product.images?.[selectedImage]}
            alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 bg-white rounded-lg px-4 py-3">
          <Link to="/" className="hover:text-primary">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/products" className="hover:text-primary">Sản phẩm</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary font-medium truncate">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left - Image Gallery */}
            <div className="p-6 border-r border-gray-100">
              {/* Main Image */}
              <div className="relative aspect-square bg-gradient-to-b from-gray-50 to-white rounded-xl overflow-hidden mb-4 group">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => setImageZoom(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-24 h-24 text-gray-300" />
                  </div>
                )}

                {/* Navigation Arrows */}
                {product.images?.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Zoom hint */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Click để phóng to
                </div>
              </div>

              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                          selectedImage === index
                            ? "border-primary shadow-md"
                            : "border-gray-200 hover:border-primary/50"
                        )}
                      >
                        <img src={img} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  {/* Image counter */}
                  <div className="text-center text-sm text-gray-500 mt-2">
                    {selectedImage + 1} / {product.images.length} ảnh
                  </div>
                </div>
              )}
            </div>

            {/* Right - Product Info */}
            <div className="p-6">
              {/* Product Title */}
              <h1 className="text-xl lg:text-2xl font-bold text-[#1a2a4a] mb-2 leading-tight">
                {product.name} - Bản Quốc Tế
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4 text-gray-300" />
                  ))}
                </div>
                <span>(0 đánh giá của khách hàng)</span>
              </div>

              {/* Price Section */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-5 border border-red-100">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-3xl font-black text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  <Badge className="bg-yellow-400 text-gray-900 font-bold border-none">
                    ⚡ GIẢM {discount}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span className="line-through">{formatCurrency(originalPrice)}</span>
                  <span>(Đã bao gồm VAT)</span>
                  <Badge variant="outline" className="ml-2 border-green-500 text-green-600 bg-green-50">
                    <Check className="w-3 h-3 mr-1" /> CHÍNH HÃNG
                  </Badge>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-2.5 h-2.5 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                </span>
              </div>

              {/* Suggested Variants */}
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Chọn phiên bản
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border-2 border-primary rounded-lg p-2 bg-red-50 cursor-pointer">
                    <div className="text-xs font-medium text-gray-800 line-clamp-2">{product.name}</div>
                    <div className="text-sm font-bold text-primary">{formatCurrency(product.price)}</div>
                    <div className="text-[10px] text-green-600">✓ Còn hàng</div>
                  </div>
                  {suggestedProducts.slice(0, 3).map(p => (
                    <Link key={p.id} to={`/products/${p.slug}`} className="border border-gray-200 rounded-lg p-2 hover:border-primary/50 transition-colors">
                      <div className="text-xs font-medium text-gray-800 line-clamp-2">{p.name}</div>
                      <div className="text-sm font-bold text-gray-600">{formatCurrency(p.price)}</div>
                      <div className="text-[10px] text-green-600">✓ Còn hàng</div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-5">
                <h3 className="font-semibold text-gray-900 mb-3">Chọn Màu Sắc</h3>
                <div className="flex gap-3 mb-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all relative",
                        selectedColor === color.name
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-gray-300 hover:border-primary/50"
                      )}
                      style={{ backgroundColor: color.code }}
                    >
                      {selectedColor === color.name && (
                        <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Màu đã chọn: <span className="font-semibold text-gray-900">{selectedColor}</span>
                  <span className="float-right text-primary font-bold">{formatCurrency(product.price)}</span>
                </p>
              </div>

              {/* Quantity */}
              <div className="mb-5 flex items-center gap-4">
                <span className="font-semibold text-gray-900">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-l-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold border-x border-gray-300 h-10 flex items-center justify-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-r-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-red-700 text-white font-bold h-14 text-base flex-col py-2"
                  disabled={product.stock_quantity <= 0}
                  onClick={handleBuyNow}
                >
                  <span>MUA NGAY</span>
                  <span className="text-xs font-normal opacity-80">Giao hàng nhanh tận nơi</span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary text-primary hover:bg-red-50 font-bold h-14 text-base flex-col py-2"
                  disabled={product.stock_quantity <= 0}
                  onClick={handleAddToCart}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    THÊM VÀO GIỎ
                  </span>
                  <span className="text-xs font-normal opacity-80">Mua nhiều sản phẩm</span>
                </Button>
              </div>

              {/* Hotline */}
              <a href="tel:0826123678" className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                <Phone className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  Gọi ngay <strong>0826.123.678</strong> để được tư vấn miễn phí
                </span>
              </a>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Truck className="w-5 h-5 mx-auto text-primary mb-1" />
                  <div className="text-[10px] font-medium text-gray-600">Miễn phí giao hàng</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 mx-auto text-primary mb-1" />
                  <div className="text-[10px] font-medium text-gray-600">Bảo hành 24 tháng</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <RefreshCw className="w-5 h-5 mx-auto text-primary mb-1" />
                  <div className="text-[10px] font-medium text-gray-600">Đổi trả 7 ngày</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Products Section */}
        {suggestedProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
              <div className="bg-primary text-white p-2 rounded-lg">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sản phẩm gợi ý</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {suggestedProducts.map(p => (
                  <SuggestedProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Description Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Mô tả sản phẩm</h2>
          </div>
          <div className="p-6">
            {/* Product Preview Image */}
            {product.images?.[0] && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full max-w-2xl mx-auto"
                />
              </div>
            )}

            {/* Table of Contents */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Ưu điểm nổi bật</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Công nghệ lau sàn tiên tiến, làm sạch hiệu quả',
                  'Bảo vệ thảm tối ưu với công nghệ thông minh',
                  'Vượt chướng ngại vật thông minh',
                  'Lực hút mạnh mẽ lên đến 30.000Pa',
                  'Tự giặt con lăn bằng nước nóng 100℃',
                  'Tự động đổ rác, rảnh tay lên đến 100 ngày'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description Content */}
            <div className="prose max-w-none">
              {product.description ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {product.name} đánh dấu bước tiến mới trong hành trình chinh phục trải nghiệm dọn dẹp toàn diện tại nhà.
                  Trang bị hệ thống lau sàn tiên tiến cùng công nghệ hiện đại, robot dễ dàng loại bỏ mọi vết bẩn cứng đầu.
                  Robot còn hội tụ loạt công nghệ tiên tiến như khả năng vượt chướng ngại, tự tránh vật cản 3D, hệ thống hút mạnh mẽ,
                  tự giặt, sấy, làm khô và tự động đổ rác giúp bạn rảnh tay. Mang đến giải pháp dọn dẹp thông minh, linh hoạt cho mọi gia đình.
                </p>
              )}
            </div>

            {/* Additional Images */}
            {product.images?.length > 1 && (
              <div className="mt-6 space-y-4">
                {product.images.slice(1, 4).map((img, index) => (
                  <div key={index} className="rounded-xl overflow-hidden">
                    <img src={img} alt={`${product.name} - Ảnh ${index + 2}`} className="w-full max-w-2xl mx-auto" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Specifications Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Thông số kỹ thuật</h2>
          </div>
          <div className="p-6">
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Thương hiệu', product.brand_name || 'N/A'],
                    ['SKU', product.sku],
                    ['Loại sản phẩm', PRODUCT_TYPES[product.product_type]?.label || 'N/A'],
                    ['Bảo hành', `${product.warranty_months || 12} tháng`],
                    ['Xuất xứ', 'Chính hãng'],
                    ['Lực hút tối đa', '30.000Pa'],
                    ['Dung lượng pin', '5.200mAh'],
                    ['Trọng lượng', '4.5kg']
                  ].map(([label, value], i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="bg-gray-50 px-4 py-3 font-medium text-gray-700 w-1/3">{label}</td>
                      <td className="px-4 py-3 text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Đánh giá khách hàng</h2>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">0</span>
              <span className="text-gray-500">đánh giá</span>
            </div>
          </div>
          <div className="p-6">
            {/* No Reviews */}
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl mb-6">
              <p className="text-gray-500 mb-4">Chưa có nhận xét nào</p>
              <p className="text-sm text-gray-400">Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này</p>
            </div>

            {/* Write Review Button */}
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="w-full bg-primary hover:bg-red-600 text-white font-semibold"
            >
              Viết nhận xét đầu tiên
            </Button>

            {/* Review Form */}
            {showReviewForm && (
              <div className="mt-6 border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">Viết nhận xét sản phẩm</h3>

                {/* Star Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⭐ Đánh giá của bạn *
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className="p-1 hover:scale-110 transition-transform">
                        <Star className="w-8 h-8 text-gray-300 hover:text-yellow-400 hover:fill-yellow-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Tiêu đề đánh giá *
                  </label>
                  <Input placeholder="Nhập tiêu đề đánh giá" className="border-gray-200" />
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💬 Nội dung đánh giá *
                  </label>
                  <Textarea
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    rows={4}
                    className="border-gray-200"
                  />
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📷 Ảnh kèm đánh giá
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-red-300 transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Tối đa 3 ảnh, mỗi ảnh ≤ 5MB</p>
                    <p className="text-xs text-gray-400">Định dạng: JPG/PNG/WebP</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">👤 Thông tin cá nhân *</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Tên của bạn" className="border-gray-200" />
                    <Input placeholder="Email" type="email" className="border-gray-200" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1"
                  >
                    ❌ Hủy
                  </Button>
                  <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                    ✅ Gửi đánh giá
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
