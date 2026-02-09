import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminAPI } from '@/lib/api';
import { Editor } from '@tinymce/tinymce-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, X, Image as ImageIcon, Settings, FileText } from 'lucide-react';

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

  const openCreateMode = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditMode = (product) => {
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
    if (e) e.preventDefault();
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

  if (dialogOpen) {
    return (
      <div className="p-8 max-w-6xl mx-auto" data-testid="product-editor">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 -mt-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setDialogOpen(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {editingProduct ? `Lần cuối cập nhật: ${new Date(editingProduct.created_at).toLocaleDateString('vi-VN')}` : 'Nhập thông tin sản phẩm mới'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Save className="w-4 h-4" />
              Lưu sản phẩm
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="general" className="gap-2">
              <FileText className="w-4 h-4" />
              Thông tin chung
            </TabsTrigger>
            <TabsTrigger value="description" className="gap-2">
              <Settings className="w-4 h-4" />
              Mô tả chi tiết
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Hình ảnh & Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Tên sản phẩm *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ecovacs Deebot X2 Omni"
                      required
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Loại sản phẩm *</Label>
                    <Select
                      value={formData.product_type}
                      onValueChange={(v) => setFormData({ ...formData, product_type: v })}
                    >
                      <SelectTrigger>
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
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Giá & Theo dõi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giá bán (VNĐ) *</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="description" className="space-y-6">
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Mô tả sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Input
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Mô tả ngắn gọn hiển thị ở danh mục..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả chi tiết</Label>
                  <div className="border rounded-md overflow-hidden bg-white">
                    <Editor
                      apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                      init={{
                        height: 600,
                        menubar: true,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'image media table | removeformat | help',
                        content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }',
                        skin: 'oxide-dark',
                        content_css: 'dark',
                      }}
                      value={formData.description}
                      onEditorChange={(content) => setFormData({ ...formData, description: content })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Hình ảnh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ảnh sản phẩm (URL, mỗi dòng một ảnh)</Label>
                  <Textarea
                    value={formData.images.join('\n')}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value.split('\n').filter(Boolean) })}
                    placeholder="https://example.com/image1.jpg"
                    rows={6}
                  />
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-lg border overflow-hidden relative group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            images: formData.images.filter((_, i) => i !== idx)
                          })}
                          className="absolute top-1 right-1 bg-destructive p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="products-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm</p>
        </div>
        <Button onClick={openCreateMode} className="gap-2" data-testid="add-product-btn">
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
                            <DropdownMenuItem onClick={() => openEditMode(product)}>
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
    </div>
  );
}
