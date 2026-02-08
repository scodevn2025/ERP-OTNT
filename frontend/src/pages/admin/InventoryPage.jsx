import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Check,
  X,
  Package,
  Trash2,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const DOC_TYPES = {
  receipt: { label: 'Phiếu nhập', icon: ArrowDownToLine, color: 'text-success' },
  issue: { label: 'Phiếu xuất', icon: ArrowUpFromLine, color: 'text-destructive' },
  transfer: { label: 'Phiếu chuyển', icon: ArrowLeftRight, color: 'text-info' },
  adjustment: { label: 'Điều chỉnh', icon: FileText, color: 'text-warning' },
  return: { label: 'Phiếu trả', icon: ArrowDownToLine, color: 'text-purple-400' },
};

const STATUS_BADGES = {
  draft: { label: 'Nháp', variant: 'secondary' },
  posted: { label: 'Đã duyệt', variant: 'default' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('documents');
  const [docs, setDocs] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockBalance, setStockBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  
  const [filterType, setFilterType] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  
  const [formData, setFormData] = useState({
    doc_type: 'receipt',
    warehouse_id: '',
    dest_warehouse_id: '',
    reference: '',
    note: '',
    lines: [{ product_id: '', quantity: 1, unit_cost: 0, note: '' }],
  });

  const fetchData = async () => {
    try {
      const [docsRes, whRes, productsRes, stockRes] = await Promise.all([
        adminAPI.getInventoryDocs({ doc_type: filterType || undefined, warehouse_id: filterWarehouse || undefined }),
        adminAPI.getWarehouses(),
        adminAPI.getProducts({}),
        adminAPI.getStockBalance({}),
      ]);
      setDocs(docsRes.data);
      setWarehouses(whRes.data);
      setProducts(productsRes.data);
      setStockBalance(stockRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, filterWarehouse]);

  const resetForm = () => {
    const defaultWarehouse = warehouses.find(w => w.is_default);
    setFormData({
      doc_type: 'receipt',
      warehouse_id: defaultWarehouse?.id || '',
      dest_warehouse_id: '',
      reference: '',
      note: '',
      lines: [{ product_id: '', quantity: 1, unit_cost: 0, note: '' }],
    });
  };

  const openCreateDialog = (docType = 'receipt') => {
    const defaultWarehouse = warehouses.find(w => w.is_default);
    setFormData({
      doc_type: docType,
      warehouse_id: defaultWarehouse?.id || '',
      dest_warehouse_id: '',
      reference: '',
      note: '',
      lines: [{ product_id: '', quantity: 1, unit_cost: 0, note: '' }],
    });
    setDialogOpen(true);
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { product_id: '', quantity: 1, unit_cost: 0, note: '' }],
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
    
    // Auto-fill cost price from product
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newLines[index].unit_cost = product.cost_price || 0;
      }
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.warehouse_id) {
      toast.error('Vui lòng chọn kho');
      return;
    }
    if (formData.doc_type === 'transfer' && !formData.dest_warehouse_id) {
      toast.error('Vui lòng chọn kho đích cho phiếu chuyển');
      return;
    }
    if (formData.lines.some(l => !l.product_id || l.quantity <= 0)) {
      toast.error('Vui lòng điền đầy đủ thông tin sản phẩm');
      return;
    }
    
    try {
      await adminAPI.createInventoryDoc(formData);
      toast.success('Tạo phiếu thành công!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi tạo phiếu');
    }
  };

  const handlePost = async (doc) => {
    if (!window.confirm(`Duyệt phiếu ${doc.doc_number}? Thao tác này sẽ cập nhật tồn kho.`)) return;
    try {
      await adminAPI.postInventoryDoc(doc.id);
      toast.success('Duyệt phiếu thành công!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi duyệt phiếu');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Xóa phiếu ${doc.doc_number}?`)) return;
    try {
      await adminAPI.deleteInventoryDoc(doc.id);
      toast.success('Xóa phiếu thành công!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi xóa phiếu');
    }
  };

  const viewDocument = async (doc) => {
    try {
      const response = await adminAPI.getInventoryDoc(doc.id);
      setViewingDoc(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Lỗi khi tải phiếu');
    }
  };

  const totalLines = formData.lines.reduce((sum, l) => sum + (l.quantity * l.unit_cost), 0);

  return (
    <div className="p-8" data-testid="inventory-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Quản lý kho</h1>
          <p className="text-muted-foreground">Nhập xuất, chuyển kho và theo dõi tồn kho</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openCreateDialog('receipt')} className="gap-2" data-testid="create-receipt-btn">
            <ArrowDownToLine className="w-4 h-4" />
            Nhập kho
          </Button>
          <Button onClick={() => openCreateDialog('issue')} variant="outline" className="gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            Xuất kho
          </Button>
          <Button onClick={() => openCreateDialog('transfer')} variant="outline" className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Chuyển kho
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="documents">Phiếu kho</TabsTrigger>
          <TabsTrigger value="stock">Tồn kho</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents">
          {/* Filters */}
          <Card className="border-border/40 bg-card/50 mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Loại phiếu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {Object.entries(DOC_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                  <SelectTrigger className="w-48">
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

          {/* Documents Table */}
          <Card className="border-border/40 bg-card/50">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton-pulse" />)}
                </div>
              ) : docs.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có phiếu kho nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Số phiếu</th>
                        <th>Loại</th>
                        <th>Kho</th>
                        <th>Số lượng</th>
                        <th>Giá trị</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc) => {
                        const DocIcon = DOC_TYPES[doc.doc_type]?.icon || FileText;
                        return (
                          <tr key={doc.id}>
                            <td>
                              <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {doc.doc_number}
                              </code>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <DocIcon className={`w-4 h-4 ${DOC_TYPES[doc.doc_type]?.color}`} />
                                <span>{DOC_TYPES[doc.doc_type]?.label}</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <p>{doc.warehouse_name}</p>
                                {doc.dest_warehouse_name && (
                                  <p className="text-xs text-muted-foreground">→ {doc.dest_warehouse_name}</p>
                                )}
                              </div>
                            </td>
                            <td>{doc.total_items}</td>
                            <td>{formatCurrency(doc.total_value)}</td>
                            <td>
                              <Badge variant={STATUS_BADGES[doc.status]?.variant}>
                                {STATUS_BADGES[doc.status]?.label}
                              </Badge>
                            </td>
                            <td className="text-muted-foreground">
                              {formatDate(doc.created_at)}
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => viewDocument(doc)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {doc.status === 'draft' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-success hover:text-success"
                                      onClick={() => handlePost(doc)}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDelete(doc)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock">
          <Card className="border-border/40 bg-card/50">
            <CardContent className="p-0">
              {stockBalance.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Chưa có dữ liệu tồn kho</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>SKU</th>
                        <th>Kho</th>
                        <th>Tồn kho</th>
                        <th>Giá vốn TB</th>
                        <th>Giá trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockBalance.map((item, index) => (
                        <tr key={index}>
                          <td className="font-medium">{item.product_name}</td>
                          <td>
                            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {item.product_sku}
                            </code>
                          </td>
                          <td>{item.warehouse_name}</td>
                          <td className={item.quantity < 5 ? 'text-warning font-semibold' : ''}>
                            {item.quantity}
                          </td>
                          <td>{formatCurrency(item.avg_cost)}</td>
                          <td className="font-medium">{formatCurrency(item.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              {DOC_TYPES[formData.doc_type]?.icon && (
                <span className={DOC_TYPES[formData.doc_type]?.color}>
                  {(() => { const Icon = DOC_TYPES[formData.doc_type].icon; return <Icon className="w-5 h-5" />; })()}
                </span>
              )}
              Tạo {DOC_TYPES[formData.doc_type]?.label}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại phiếu</Label>
                <Select
                  value={formData.doc_type}
                  onValueChange={(v) => setFormData({ ...formData, doc_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kho {formData.doc_type === 'transfer' ? 'nguồn' : ''} *</Label>
                <Select
                  value={formData.warehouse_id}
                  onValueChange={(v) => setFormData({ ...formData, warehouse_id: v })}
                >
                  <SelectTrigger data-testid="warehouse-select">
                    <SelectValue placeholder="Chọn kho" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.doc_type === 'transfer' && (
                <div className="space-y-2">
                  <Label>Kho đích *</Label>
                  <Select
                    value={formData.dest_warehouse_id}
                    onValueChange={(v) => setFormData({ ...formData, dest_warehouse_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kho đích" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.filter(w => w.id !== formData.warehouse_id).map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Mã tham chiếu</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="PO-001, INV-001..."
                />
              </div>
            </div>

            {/* Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Chi tiết sản phẩm</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="w-4 h-4 mr-1" /> Thêm dòng
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.lines.map((line, index) => (
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
                    </div>
                    <div className="w-24 space-y-2">
                      <Label className="text-xs">Số lượng *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label className="text-xs">Đơn giá</Label>
                      <Input
                        type="number"
                        min="0"
                        value={line.unit_cost}
                        onChange={(e) => updateLine(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label className="text-xs">Thành tiền</Label>
                      <div className="h-10 flex items-center font-medium">
                        {formatCurrency(line.quantity * line.unit_cost)}
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
                ))}
              </div>

              <div className="flex justify-end p-4 rounded-lg bg-muted/50">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tổng giá trị</p>
                  <p className="font-heading text-2xl font-bold text-primary">{formatCurrency(totalLines)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ghi chú thêm..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="inventory-submit-btn">
                Tạo phiếu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Chi tiết phiếu {viewingDoc?.doc_number}
            </DialogTitle>
          </DialogHeader>
          {viewingDoc && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loại phiếu</p>
                  <p className="font-medium">{DOC_TYPES[viewingDoc.doc_type]?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={STATUS_BADGES[viewingDoc.status]?.variant}>
                    {STATUS_BADGES[viewingDoc.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kho</p>
                  <p className="font-medium">{viewingDoc.warehouse_name}</p>
                </div>
                {viewingDoc.dest_warehouse_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kho đích</p>
                    <p className="font-medium">{viewingDoc.dest_warehouse_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Người tạo</p>
                  <p className="font-medium">{viewingDoc.created_by_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">{formatDate(viewingDoc.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Chi tiết</p>
                <div className="space-y-2">
                  {viewingDoc.lines?.map((line, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{line.product_name}</p>
                        <p className="text-sm text-muted-foreground">{line.product_sku}</p>
                      </div>
                      <div className="text-right">
                        <p>{line.quantity} x {formatCurrency(line.unit_cost)}</p>
                        <p className="font-medium">{formatCurrency(line.total_cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end p-4 rounded-lg bg-muted/50">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tổng giá trị</p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {formatCurrency(viewingDoc.total_value)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
