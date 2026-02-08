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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Warehouse, MapPin, Phone, Star } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    is_default: false,
  });

  const fetchWarehouses = async () => {
    try {
      const response = await adminAPI.getWarehouses();
      setWarehouses(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', code: '', address: '', phone: '', is_default: false });
    setEditingWarehouse(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      is_default: warehouse.is_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await adminAPI.updateWarehouse(editingWarehouse.id, formData);
        toast.success('Cập nhật kho thành công!');
      } else {
        await adminAPI.createWarehouse(formData);
        toast.success('Thêm kho thành công!');
      }
      setDialogOpen(false);
      resetForm();
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi lưu kho');
    }
  };

  const handleDelete = async (warehouse) => {
    if (!window.confirm(`Xóa kho "${warehouse.name}"?`)) return;
    try {
      await adminAPI.deleteWarehouse(warehouse.id);
      toast.success('Xóa kho thành công!');
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi xóa kho');
    }
  };

  return (
    <div className="p-8" data-testid="warehouses-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Kho hàng</h1>
          <p className="text-muted-foreground">Quản lý các kho hàng trong hệ thống</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2" data-testid="add-warehouse-btn">
          <Plus className="w-4 h-4" />
          Thêm kho
        </Button>
      </div>

      {/* Warehouses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 skeleton-pulse rounded-lg" />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <Card className="border-border/40 bg-card/50">
          <CardContent className="p-12 text-center">
            <Warehouse className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có kho nào</p>
            <Button onClick={openCreateDialog} variant="outline" className="mt-4">
              Thêm kho đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((warehouse) => (
            <Card
              key={warehouse.id}
              className="border-border/40 bg-card/50 hover:bg-card/80 transition-colors group"
              data-testid={`warehouse-${warehouse.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Warehouse className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-semibold">{warehouse.name}</h3>
                        {warehouse.is_default && (
                          <Star className="w-4 h-4 text-warning fill-warning" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">{warehouse.code}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(warehouse)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(warehouse)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  {warehouse.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{warehouse.address}</span>
                    </div>
                  )}
                  {warehouse.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{warehouse.phone}</span>
                    </div>
                  )}
                </div>
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
              {editingWarehouse ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên kho *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Kho Hà Nội"
                required
                data-testid="warehouse-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Mã kho *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="WH-HN"
                required
                data-testid="warehouse-code-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Cầu Giấy, Hà Nội"
              />
            </div>
            <div className="space-y-2">
              <Label>Điện thoại</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="024-1234-5678"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Kho mặc định</p>
                <p className="text-sm text-muted-foreground">Sử dụng làm kho mặc định khi tạo phiếu</p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(v) => setFormData({ ...formData, is_default: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="warehouse-submit-btn">
                {editingWarehouse ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
