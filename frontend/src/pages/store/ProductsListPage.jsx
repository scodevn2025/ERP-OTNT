import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { storeAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ShoppingCart, Shield, X, Filter, ChevronDown } from 'lucide-react';
import { formatCurrency, PRODUCT_TYPES } from '@/lib/utils';

// Product Card Component
function ProductCard({ product }) {
  const originalPrice = product.price * 1.3;
  const discount = Math.round((1 - product.price / originalPrice) * 100);
  const savings = originalPrice - product.price;

  return (
    <Card className="group border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <Badge className="bg-red-500 text-white font-bold px-2 py-1 text-xs">
              -{discount}%
            </Badge>
          </div>
          
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[40px] group-hover:text-red-600 transition-colors text-sm">
            {product.name}
          </h3>

          <div className="mt-2 space-y-1">
            <div className="text-gray-400 text-xs line-through">
              Giá gốc: {formatCurrency(originalPrice)}
            </div>
            <div className="text-red-600 font-bold text-base">
              Giá KM: {formatCurrency(product.price)}
            </div>
            <div className="text-green-600 text-xs font-medium">
              Tiết kiệm: {formatCurrency(savings)} (-{discount}%)
            </div>
          </div>

          <Button 
            className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-semibold gap-2 text-sm"
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

export default function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';
  const categoryFilter = searchParams.get('category') || '';
  const brandFilter = searchParams.get('brand') || '';

  const priceRanges = [
    { label: 'Dưới 5 triệu', min: 0, max: 5000000 },
    { label: '5 - 10 triệu', min: 5000000, max: 10000000 },
    { label: '10 - 20 triệu', min: 10000000, max: 20000000 },
    { label: '20 - 50 triệu', min: 20000000, max: 50000000 },
    { label: 'Trên 50 triệu', min: 50000000, max: 999999999 },
  ];

  const fetchData = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.product_type = typeFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      if (brandFilter) params.brand_id = brandFilter;

      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        storeAPI.getProducts(params),
        storeAPI.getCategories(),
        storeAPI.getBrands(),
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, typeFilter, categoryFilter, brandFilter]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = search || typeFilter || categoryFilter || brandFilter;

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="products-list-page">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-red-500">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Sản phẩm</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Bộ lọc
              </h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📁 Danh mục
                </h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox 
                        checked={categoryFilter === cat.id}
                        onCheckedChange={(checked) => updateFilter('category', checked ? cat.id : '')}
                        className="border-gray-300"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-red-500">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🏷️ Thương hiệu
                </h4>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox 
                        checked={brandFilter === brand.id}
                        onCheckedChange={(checked) => updateFilter('brand', checked ? brand.id : '')}
                        className="border-gray-300"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-red-500">
                        {brand.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  💰 Mức giá
                </h4>
                <div className="space-y-2">
                  {priceRanges.map((range, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox className="border-gray-300" />
                      <span className="text-sm text-gray-600 group-hover:text-red-500">
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search & Sort Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10 border-gray-200 focus:border-red-500"
                    data-testid="search-input"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={(v) => updateFilter('type', v)}>
                    <SelectTrigger className="w-40 border-gray-200" data-testid="type-filter">
                      <SelectValue placeholder="Loại sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.entries(PRODUCT_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    className="lg:hidden gap-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4" />
                    Lọc
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                Tìm thấy <span className="font-semibold text-red-500">{products.length}</span> sản phẩm
              </p>
              <Select defaultValue="newest">
                <SelectTrigger className="w-40 border-gray-200">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                  <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="text-red-500 border-red-200">
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Link key={product.id} to={`/products/${product.slug}`}>
                      <ProductCard product={product} />
                    </Link>
                  ))}
                </div>

                {/* Load More */}
                <div className="text-center mt-8">
                  <Button variant="outline" size="lg" className="px-8 border-red-200 text-red-500 hover:bg-red-50">
                    Xem thêm sản phẩm
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
