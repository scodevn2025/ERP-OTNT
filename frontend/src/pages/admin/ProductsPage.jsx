import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Package, MoreHorizontal } from 'lucide-react';
import { formatCurrency, generateSlug, PRODUCT_TYPES } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    product_type: 'robot',
    category_id: '',
    brand_id: '',
    description: '',
    short_description: '',
    price: 0,
    cost_price: 0,
    sale_price: null,
    warranty_months: 12,
    track_serial: false,
    images: [],
    specifications: {},
    compatible_models: [],
    tags: [],
  });

  const fetchData = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.product_type = typeFilter;

      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        adminAPI.getProducts(params),
        adminAPI.getCategories(),
        adminAPI.getBrands(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, typeFilter]);

  const handleSearch = (value) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    setSearchParams(params);
  };

  const handleTypeFilter = (value) => {
    setTypeFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') params.set('type', value);
    else params.delete('type');
    setSearchParams(params);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      sku: '',
      product_type: 'robot',
      category_id: '',
      brand_id: '',
      description: '',
      short_description: '',
      price: 0,
      cost_price: 0,
      sale_price: null,
      warranty_months: 12,
      track_serial: false,
      images: [],
      specifications: {},
      compatible_models: [],
      tags: [],
    });
    setEditingProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      product_type: product.product_type,
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price,
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      warranty_months: product.warranty_months,
      track_serial: product.track_serial,
      images: product.images || [],
      specifications: product.specifications || {},
      compatible_models: product.compatible_models || [],
      tags: product.tags || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
      };

      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, data);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await adminAPI.createProduct(data);
        toast.success('Thêm sản phẩm thành công!');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi lưu sản phẩm');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    try {
      await adminAPI.deleteProduct(product.id);
      toast.success('Xóa sản phẩm thành công!');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  return (
    <div className="p-8" data-testid="products-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2" data-testid="add-product-btn">
          <Plus className="w-4 h-4" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/40 bg-card/50 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc SKU..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="type-filter">
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
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-border/40 bg-card/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 skeleton-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
              <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                Thêm sản phẩm đầu tiên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>SKU</th>
                    <th>Loại</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} data-testid={`product-row-${product.id}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.brand_name} {product.category_name && `• ${product.category_name}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{product.sku}</code>
                      </td>
                      <td>
                        <Badge variant="outline" className={PRODUCT_TYPES[product.product_type]?.color}>
                          {PRODUCT_TYPES[product.product_type]?.label}
                        </Badge>
                      </td>
                      <td className="font-medium">{formatCurrency(product.price)}</td>
                      <td>
                        <span className={product.stock_quantity < 5 ? 'text-warning' : ''}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(product)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Tên sản phẩm *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ecovacs Deebot X2 Omni"
                  required
                  data-testid="product-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ecovacs-deebot-x2-omni"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="ECO-X2-OMNI"
                  required
                  data-testid="product-sku-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Loại sản phẩm *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(v) => setFormData({ ...formData, product_type: v })}
                >
                  <SelectTrigger data-testid="product-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thương hiệu</Label>
                <Select
                  value={formData.brand_id}
                  onValueChange={(v) => setFormData({ ...formData, brand_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thương hiệu" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bảo hành (tháng)</Label>
                <Input
                  type="number"
                  value={formData.warranty_months}
                  onChange={(e) => setFormData({ ...formData, warranty_months: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Giá bán (VNĐ) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="product-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Giá vốn (VNĐ)</Label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Mô tả ngắn</Label>
                <Input
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Mô tả ngắn gọn..."
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả đầy đủ về sản phẩm..."
                  rows={4}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Ảnh sản phẩm (URL, mỗi dòng một ảnh)</Label>
                <Textarea
                  value={formData.images.join('\n')}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg"
                  rows={3}
                />
              </div>
              <div className="col-span-2 flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium">Tracking Serial/IMEI</p>
                  <p className="text-sm text-muted-foreground">Theo dõi từng thiết bị theo số serial</p>
                </div>
                <Switch
                  checked={formData.track_serial}
                  onCheckedChange={(v) => setFormData({ ...formData, track_serial: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="product-submit-btn">
                {editingProduct ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
