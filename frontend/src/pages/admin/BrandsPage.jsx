import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Award } from 'lucide-react';
import { generateSlug } from '@/lib/utils';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    description: '',
    country: '',
  });

  const fetchBrands = async () => {
    try {
      const response = await adminAPI.getBrands();
      setBrands(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', slug: '', logo_url: '', description: '', country: '' });
    setEditingBrand(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url || '',
      description: brand.description || '',
      country: brand.country || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await adminAPI.updateBrand(editingBrand.id, formData);
        toast.success('Cập nhật thương hiệu thành công!');
      } else {
        await adminAPI.createBrand(formData);
        toast.success('Thêm thương hiệu thành công!');
      }
      setDialogOpen(false);
      resetForm();
      fetchBrands();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi lưu thương hiệu');
    }
  };

  const handleDelete = async (brand) => {
    if (!window.confirm(`Xóa thương hiệu "${brand.name}"?`)) return;
    try {
      await adminAPI.deleteBrand(brand.id);
      toast.success('Xóa thương hiệu thành công!');
      fetchBrands();
    } catch (error) {
      toast.error('Lỗi khi xóa thương hiệu');
    }
  };

  const handleNameChange = (name) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  return (
    <div className="p-8" data-testid="brands-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Thương hiệu</h1>
          <p className="text-muted-foreground">Quản lý các thương hiệu sản phẩm</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2" data-testid="add-brand-btn">
          <Plus className="w-4 h-4" />
          Thêm thương hiệu
        </Button>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 skeleton-pulse rounded-lg" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <Card className="border-border/40 bg-card/50">
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có thương hiệu nào</p>
            <Button onClick={openCreateDialog} variant="outline" className="mt-4">
              Thêm thương hiệu đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className="border-border/40 bg-card/50 hover:bg-card/80 transition-colors group"
              data-testid={`brand-${brand.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <Award className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold">{brand.name}</h3>
                      <p className="text-sm text-muted-foreground">{brand.country || 'Không xác định'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(brand)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(brand)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {brand.description && (
                  <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{brand.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên thương hiệu *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ecovacs"
                required
                data-testid="brand-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ecovacs"
              />
            </div>
            <div className="space-y-2">
              <Label>Quốc gia</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Trung Quốc"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo (URL)</Label>
              <Input
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả thương hiệu..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="brand-submit-btn">
                {editingBrand ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
