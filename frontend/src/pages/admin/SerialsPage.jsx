import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Barcode, Eye, Package, History, Shield } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_BADGES = {
  in_stock: { label: 'Trong kho', variant: 'default', color: 'bg-emerald-500/20 text-emerald-400' },
  sold: { label: 'Đã bán', variant: 'secondary', color: 'bg-blue-500/20 text-blue-400' },
  warranty: { label: 'Bảo hành', variant: 'outline', color: 'bg-amber-500/20 text-amber-400' },
  repair: { label: 'Sửa chữa', variant: 'outline', color: 'bg-purple-500/20 text-purple-400' },
  returned: { label: 'Đã trả', variant: 'destructive', color: 'bg-orange-500/20 text-orange-400' },
  scrapped: { label: 'Hủy', variant: 'destructive', color: 'bg-red-500/20 text-red-400' },
};

export default function SerialsPage() {
  const [serials, setSerials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSerial, setViewingSerial] = useState(null);
  const [movements, setMovements] = useState([]);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  
  const [formData, setFormData] = useState({
    serial_number: '',
    imei: '',
    product_id: '',
    warehouse_id: '',
    cost_price: 0,
    note: '',
  });

  const fetchData = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      
      const [serialsRes, whRes, productsRes] = await Promise.all([
        adminAPI.getSerials(params),
        adminAPI.getWarehouses(),
        adminAPI.getProducts({ limit: 1000 }),
      ]);
      setSerials(serialsRes.data);
      setWarehouses(whRes.data);
      setProducts(productsRes.data.filter(p => p.track_serial));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, warehouseFilter]);

  const resetForm = () => {
    const defaultWarehouse = warehouses.find(w => w.is_default);
    setFormData({
      serial_number: '',
      imei: '',
      product_id: '',
      warehouse_id: defaultWarehouse?.id || '',
      cost_price: 0,
      note: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createSerial(formData);
      toast.success('Thêm Serial thành công!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi thêm Serial');
    }
  };

  const viewSerial = async (serial) => {
    try {
      const [serialRes, movementsRes] = await Promise.all([
        adminAPI.getSerial(serial.id),
        adminAPI.getSerialMovements(serial.id),
      ]);
      setViewingSerial(serialRes.data);
      setMovements(movementsRes.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Lỗi khi tải thông tin Serial');
    }
  };

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setFormData({
      ...formData,
      product_id: productId,
      cost_price: product?.cost_price || 0,
    });
  };

  return (
    <div className="p-8" data-testid="serials-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Serial/IMEI</h1>
          <p className="text-muted-foreground">Quản lý và theo dõi thiết bị theo số Serial</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2" data-testid="add-serial-btn">
          <Plus className="w-4 h-4" />
          Thêm Serial
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/40 bg-card/50 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo Serial hoặc IMEI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(STATUS_BADGES).map(([key, status]) => (
                  <SelectItem key={key} value={key}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kho</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Serials Table */}
      <Card className="border-border/40 bg-card/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton-pulse" />)}
            </div>
          ) : serials.length === 0 ? (
            <div className="p-12 text-center">
              <Barcode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có Serial nào</p>
              <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                Thêm Serial đầu tiên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Serial</th>
                    <th>Sản phẩm</th>
                    <th>Kho</th>
                    <th>Trạng thái</th>
                    <th>Bảo hành</th>
                    <th>Khách hàng</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {serials.map((serial) => (
                    <tr key={serial.id}>
                      <td>
                        <div>
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {serial.serial_number}
                          </code>
                          {serial.imei && (
                            <p className="text-xs text-muted-foreground mt-1">IMEI: {serial.imei}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{serial.product_name}</p>
                          <p className="text-xs text-muted-foreground">{serial.product_sku}</p>
                        </div>
                      </td>
                      <td>{serial.warehouse_name || '-'}</td>
                      <td>
                        <Badge className={STATUS_BADGES[serial.status]?.color}>
                          {STATUS_BADGES[serial.status]?.label}
                        </Badge>
                      </td>
                      <td>
                        {serial.warranty_end ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Shield className="w-4 h-4 text-success" />
                            <span>{formatDate(serial.warranty_end)}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td>{serial.customer_name || '-'}</td>
                      <td>
                        <Button variant="ghost" size="icon" onClick={() => viewSerial(serial)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Thêm Serial mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Sản phẩm *</Label>
              <Select
                value={formData.product_id}
                onValueChange={handleProductChange}
              >
                <SelectTrigger data-testid="serial-product-select">
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số Serial *</Label>
              <Input
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value.toUpperCase() })}
                placeholder="SN-123456789"
                required
                data-testid="serial-number-input"
              />
            </div>
            <div className="space-y-2">
              <Label>IMEI (nếu có)</Label>
              <Input
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                placeholder="123456789012345"
              />
            </div>
            <div className="space-y-2">
              <Label>Kho nhập *</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(v) => setFormData({ ...formData, warehouse_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kho" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Giá vốn</Label>
              <Input
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="serial-submit-btn">
                Thêm mới
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Barcode className="w-5 h-5" />
              Chi tiết Serial
            </DialogTitle>
          </DialogHeader>
          {viewingSerial && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <code className="font-mono text-lg bg-muted px-2 py-1 rounded">
                    {viewingSerial.serial_number}
                  </code>
                </div>
                {viewingSerial.imei && (
                  <div>
                    <p className="text-sm text-muted-foreground">IMEI</p>
                    <p className="font-mono">{viewingSerial.imei}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Sản phẩm</p>
                  <p className="font-medium">{viewingSerial.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge className={STATUS_BADGES[viewingSerial.status]?.color}>
                    {STATUS_BADGES[viewingSerial.status]?.label}
                  </Badge>
                </div>
                {viewingSerial.warehouse_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kho</p>
                    <p className="font-medium">{viewingSerial.warehouse_name}</p>
                  </div>
                )}
                {viewingSerial.customer_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Khách hàng</p>
                    <p className="font-medium">{viewingSerial.customer_name}</p>
                  </div>
                )}
                {viewingSerial.warranty_start && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bảo hành từ</p>
                    <p className="font-medium">{formatDate(viewingSerial.warranty_start)}</p>
                  </div>
                )}
                {viewingSerial.warranty_end && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bảo hành đến</p>
                    <p className="font-medium text-success">{formatDate(viewingSerial.warranty_end)}</p>
                  </div>
                )}
              </div>

              {/* Movements History */}
              <div>
                <h4 className="font-heading font-semibold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Lịch sử di chuyển
                </h4>
                {movements.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Chưa có lịch sử</p>
                ) : (
                  <div className="space-y-2">
                    {movements.map((m) => (
                      <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <p className="font-medium capitalize">{m.movement_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {m.from_warehouse_name && `${m.from_warehouse_name} → `}
                            {m.to_warehouse_name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{formatDate(m.created_at)}</p>
                          <p>{m.created_by_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
