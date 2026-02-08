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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  ShoppingCart,
  Eye,
  Check,
  CheckCheck,
  X,
  Trash2,
  User,
  Package,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_BADGES = {
  draft: { label: 'Nháp', variant: 'secondary', color: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'Đã xác nhận', variant: 'default', color: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Hoàn thành', variant: 'default', color: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { label: 'Đã hủy', variant: 'destructive', color: 'bg-red-500/20 text-red-400' },
};

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    warehouse_id: '',
    note: '',
    lines: [{ product_id: '', quantity: 1, unit_price: 0, serial_numbers: [] }],
  });
  
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes, whRes, productsRes] = await Promise.all([
        adminAPI.getSalesOrders({ status: statusFilter || undefined }),
        adminAPI.getCustomers({}),
        adminAPI.getWarehouses(),
        adminAPI.getProducts({ limit: 1000 }),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setWarehouses(whRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSerials = async (warehouseId) => {
    if (!warehouseId) return;
    try {
      const response = await adminAPI.getSerials({ warehouse_id: warehouseId, status: 'in_stock' });
      setSerials(response.data);
    } catch (error) {
      console.error('Error fetching serials:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  useEffect(() => {
    if (formData.warehouse_id) {
      fetchSerials(formData.warehouse_id);
    }
  }, [formData.warehouse_id]);

  const resetForm = () => {
    const defaultWarehouse = warehouses.find(w => w.is_default);
    setFormData({
      customer_id: '',
      warehouse_id: defaultWarehouse?.id || '',
      note: '',
      lines: [{ product_id: '', quantity: 1, unit_price: 0, serial_numbers: [] }],
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { product_id: '', quantity: 1, unit_price: 0, serial_numbers: [] }],
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length === 1) return;
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newLines[index].unit_price = product.price || 0;
        newLines[index].serial_numbers = [];
      }
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (!formData.warehouse_id) {
      toast.error('Vui lòng chọn kho');
      return;
    }
    if (formData.lines.some(l => !l.product_id || l.quantity <= 0)) {
      toast.error('Vui lòng điền đầy đủ thông tin sản phẩm');
      return;
    }
    
    try {
      await adminAPI.createSalesOrder(formData);
      toast.success('Tạo đơn hàng thành công!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi tạo đơn hàng');
    }
  };

  const handleConfirm = async (order) => {
    try {
      await adminAPI.confirmSalesOrder(order.id);
      toast.success('Xác nhận đơn hàng thành công!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi xác nhận đơn hàng');
    }
  };

  const handleComplete = async (order) => {
    if (!window.confirm(`Hoàn thành đơn hàng ${order.order_number}? Thao tác này sẽ trừ tồn kho và kích hoạt bảo hành.`)) return;
    try {
      await adminAPI.completeSalesOrder(order.id);
      toast.success('Hoàn thành đơn hàng! Bảo hành đã được kích hoạt.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi hoàn thành đơn hàng');
    }
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Hủy đơn hàng ${order.order_number}?`)) return;
    try {
      await adminAPI.cancelSalesOrder(order.id);
      toast.success('Đã hủy đơn hàng!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi hủy đơn hàng');
    }
  };

  const viewOrder = async (order) => {
    try {
      const response = await adminAPI.getSalesOrder(order.id);
      setViewingOrder(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Lỗi khi tải đơn hàng');
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createCustomer(newCustomer);
      toast.success('Thêm khách hàng thành công!');
      setCustomerDialogOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      await fetchData();
      setFormData({ ...formData, customer_id: response.data.id });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi thêm khách hàng');
    }
  };

  const totalAmount = formData.lines.reduce((sum, l) => sum + (l.quantity * l.unit_price), 0);

  return (
    <div className="p-8" data-testid="sales-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Bán hàng</h1>
          <p className="text-muted-foreground">Quản lý đơn hàng và kích hoạt bảo hành</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2" data-testid="create-order-btn">
          <Plus className="w-4 h-4" />
          Tạo đơn hàng
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/40 bg-card/50 mb-6">
        <CardContent className="p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.entries(STATUS_BADGES).map(([key, status]) => (
                <SelectItem key={key} value={key}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-border/40 bg-card/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có đơn hàng nào</p>
              <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                Tạo đơn hàng đầu tiên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Số đơn</th>
                    <th>Khách hàng</th>
                    <th>Kho</th>
                    <th>Số SP</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {order.order_number}
                        </code>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td>{order.warehouse_name}</td>
                      <td>{order.total_items}</td>
                      <td className="font-medium">{formatCurrency(order.total_amount)}</td>
                      <td>
                        <Badge className={STATUS_BADGES[order.status]?.color}>
                          {STATUS_BADGES[order.status]?.label}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground">{formatDate(order.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewOrder(order)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {order.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-400 hover:text-blue-400"
                                onClick={() => handleConfirm(order)}
                                title="Xác nhận"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success hover:text-success"
                                onClick={() => handleComplete(order)}
                                title="Hoàn thành"
                              >
                                <CheckCheck className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-success hover:text-success"
                              onClick={() => handleComplete(order)}
                              title="Hoàn thành"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </Button>
                          )}
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleCancel(order)}
                              title="Hủy"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Tạo đơn hàng mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Khách hàng *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.customer_id}
                    onValueChange={(v) => setFormData({ ...formData, customer_id: v })}
                  >
                    <SelectTrigger className="flex-1" data-testid="customer-select">
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setCustomerDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kho xuất *</Label>
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
            </div>

            {/* Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Sản phẩm</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="w-4 h-4 mr-1" /> Thêm dòng
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.lines.map((line, index) => {
                  const product = products.find(p => p.id === line.product_id);
                  const productSerials = serials.filter(s => s.product_id === line.product_id);
                  
                  return (
                    <div key={index} className="flex gap-3 items-start p-4 rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">Sản phẩm *</Label>
                        <Select
                          value={line.product_id}
                          onValueChange={(v) => updateLine(index, 'product_id', v)}
                        >
                          <SelectTrigger>
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
                        
                        {product?.track_serial && productSerials.length > 0 && (
                          <div className="mt-2">
                            <Label className="text-xs">Serial (tùy chọn)</Label>
                            <Select
                              value={line.serial_numbers[0] || ''}
                              onValueChange={(v) => updateLine(index, 'serial_numbers', v ? [v] : [])}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn Serial" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Không chọn</SelectItem>
                                {productSerials.map((s) => (
                                  <SelectItem key={s.id} value={s.serial_number}>
                                    {s.serial_number}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <div className="w-24 space-y-2">
                        <Label className="text-xs">SL *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-36 space-y-2">
                        <Label className="text-xs">Đơn giá</Label>
                        <Input
                          type="number"
                          min="0"
                          value={line.unit_price}
                          onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label className="text-xs">Thành tiền</Label>
                        <div className="h-10 flex items-center font-medium">
                          {formatCurrency(line.quantity * line.unit_price)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(index)}
                        disabled={formData.lines.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end p-4 rounded-lg bg-muted/50">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tổng tiền</p>
                  <p className="font-heading text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ghi chú đơn hàng..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="order-submit-btn">
                Tạo đơn hàng
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Chi tiết đơn hàng {viewingOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{viewingOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{viewingOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge className={STATUS_BADGES[viewingOrder.status]?.color}>
                    {STATUS_BADGES[viewingOrder.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kho xuất</p>
                  <p className="font-medium">{viewingOrder.warehouse_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">{formatDate(viewingOrder.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Sản phẩm</p>
                <div className="space-y-2">
                  {viewingOrder.lines?.map((line, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{line.product_name}</p>
                        <p className="text-sm text-muted-foreground">{line.product_sku}</p>
                        {line.serial_numbers?.length > 0 && (
                          <p className="text-xs text-primary mt-1">
                            Serial: {line.serial_numbers.join(', ')}
                          </p>
                        )}
                        {line.warranty_months > 0 && (
                          <p className="text-xs text-success">BH {line.warranty_months} tháng</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p>{line.quantity} x {formatCurrency(line.unit_price)}</p>
                        <p className="font-medium">{formatCurrency(line.total_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end p-4 rounded-lg bg-muted/50">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tổng tiền</p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {formatCurrency(viewingOrder.total_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Add Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Thêm khách hàng nhanh</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label>Họ và tên *</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại *</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="0912345678"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="Địa chỉ..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">Thêm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
