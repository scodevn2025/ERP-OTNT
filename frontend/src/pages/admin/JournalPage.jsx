import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, RefreshCw, CheckCircle, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const journalTypes = [
  { value: 'general', label: 'Phiếu kế toán', color: 'bg-gray-500' },
  { value: 'inventory', label: 'Phiếu kho', color: 'bg-blue-500' },
  { value: 'sales', label: 'Phiếu bán hàng', color: 'bg-green-500' },
  { value: 'purchase', label: 'Phiếu mua hàng', color: 'bg-orange-500' },
  { value: 'adjustment', label: 'Điều chỉnh', color: 'bg-purple-500' },
];

// Auto-suggest templates based on journal type
const journalTemplates = {
  sales: {
    description: 'Bán hàng thu tiền mặt',
    lines: [
      { accountCode: '111', description: 'Thu tiền bán hàng', debit: true },
      { accountCode: '511', description: 'Doanh thu bán hàng', credit: true },
      { accountCode: '632', description: 'Giá vốn hàng bán', debit: true },
      { accountCode: '156', description: 'Xuất kho hàng hóa', credit: true },
    ]
  },
  purchase: {
    description: 'Mua hàng nhập kho',
    lines: [
      { accountCode: '156', description: 'Nhập kho hàng hóa', debit: true },
      { accountCode: '331', description: 'Phải trả nhà cung cấp', credit: true },
    ]
  },
  inventory: {
    description: 'Nhập kho hàng hóa',
    lines: [
      { accountCode: '156', description: 'Nhập kho hàng hóa', debit: true },
      { accountCode: '331', description: 'Phải trả NCC', credit: true },
    ]
  },
  adjustment: {
    description: 'Điều chỉnh tồn kho',
    lines: [
      { accountCode: '156', description: 'Điều chỉnh hàng tồn kho', debit: true },
      { accountCode: '811', description: 'Chi phí điều chỉnh', credit: true },
    ]
  },
  general: {
    description: '',
    lines: []
  }
};

const statusColors = {
  draft: 'bg-yellow-500',
  posted: 'bg-green-500',
  reversed: 'bg-red-500',
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    journal_type: 'general',
    reference: '',
    description: '',
    lines: [
      { account_id: '', description: '', debit: 0, credit: 0 },
      { account_id: '', description: '', debit: 0, credit: 0 },
    ],
  });

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/journal-entries');
      setEntries(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách bút toán');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/admin/accounts');
      setAccounts(response.data.filter(a => !a.is_header));
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate lines
    const validLines = formData.lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) {
      toast.error('Cần ít nhất 2 dòng bút toán');
      return;
    }

    const totalDebit = validLines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const totalCredit = validLines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error(`Nợ (${formatCurrency(totalDebit)}) phải bằng Có (${formatCurrency(totalCredit)})`);
      return;
    }

    try {
      const payload = {
        journal_type: formData.journal_type,
        reference: formData.reference || null,
        description: formData.description || null,
        lines: validLines.map(l => ({
          account_id: l.account_id,
          description: l.description || null,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      };
      
      await api.post('/admin/journal-entries', payload);
      toast.success('Tạo bút toán thành công');
      
      setShowDialog(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handlePost = async (entry) => {
    if (!window.confirm(`Bạn có chắc muốn ghi sổ bút toán "${entry.entry_number}"?`)) return;
    
    try {
      await api.post(`/admin/journal-entries/${entry.id}/post`);
      toast.success('Ghi sổ thành công');
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể ghi sổ');
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bút toán "${entry.entry_number}"?`)) return;
    
    try {
      await api.delete(`/admin/journal-entries/${entry.id}`);
      toast.success('Xóa bút toán thành công');
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể xóa bút toán');
    }
  };

  const viewDetail = async (entry) => {
    try {
      const response = await api.get(`/admin/journal-entries/${entry.id}`);
      setSelectedEntry(response.data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Không thể tải chi tiết bút toán');
    }
  };

  const resetForm = () => {
    setFormData({
      journal_type: 'general',
      reference: '',
      description: '',
      lines: [
        { account_id: '', description: '', debit: 0, credit: 0 },
        { account_id: '', description: '', debit: 0, credit: 0 },
      ],
    });
  };

  // Apply auto-suggest template based on journal type
  const applyTemplate = (journalType) => {
    const template = journalTemplates[journalType];
    if (!template || template.lines.length === 0) {
      setFormData({
        ...formData,
        journal_type: journalType,
        description: '',
        lines: [
          { account_id: '', description: '', debit: 0, credit: 0 },
          { account_id: '', description: '', debit: 0, credit: 0 },
        ],
      });
      return;
    }

    // Find account IDs by code
    const newLines = template.lines.map(tl => {
      const account = accounts.find(a => a.code === tl.accountCode);
      return {
        account_id: account?.id || '',
        description: tl.description,
        debit: tl.debit ? 0 : 0,
        credit: tl.credit ? 0 : 0,
      };
    });

    setFormData({
      ...formData,
      journal_type: journalType,
      description: template.description,
      lines: newLines,
    });

    toast.success(`Đã áp dụng mẫu "${journalTypes.find(j => j.value === journalType)?.label}"`, {
      description: 'Nhập số tiền vào các dòng tương ứng',
    });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { account_id: '', description: '', debit: 0, credit: 0 }],
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length <= 2) return;
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const filteredEntries = entries.filter(e => 
    (filterType === 'all' || e.journal_type === filterType) &&
    (filterStatus === 'all' || e.status === filterStatus)
  );

  const getJournalTypeInfo = (type) => {
    return journalTypes.find(t => t.value === type) || { label: type, color: 'bg-gray-500' };
  };

  const totalDebit = formData.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

  return (
    <div className="space-y-6" data-testid="journal-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Sổ Nhật Ký Chung</h1>
          <p className="text-muted-foreground">Quản lý bút toán kế toán</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEntries} data-testid="refresh-journal">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} data-testid="add-journal-btn">
            <Plus className="w-4 h-4 mr-2" />
            Tạo bút toán
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Tất cả
          </Button>
          {journalTypes.map(type => (
            <Button
              key={type.value}
              variant={filterType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="draft">Nháp</SelectItem>
            <SelectItem value="posted">Đã ghi sổ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Số CT</TableHead>
              <TableHead className="w-32">Loại</TableHead>
              <TableHead>Diễn giải</TableHead>
              <TableHead className="w-28 text-right">Nợ</TableHead>
              <TableHead className="w-28 text-right">Có</TableHead>
              <TableHead className="w-24">Trạng thái</TableHead>
              <TableHead className="w-36">Ngày tạo</TableHead>
              <TableHead className="w-28 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Không có bút toán nào
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => {
                const typeInfo = getJournalTypeInfo(entry.journal_type);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono font-medium">
                      {entry.entry_number}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${typeInfo.color} text-white`}>
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-xs">{entry.description || entry.reference || '-'}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(entry.total_debit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(entry.total_credit)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[entry.status]}>
                        {entry.status === 'draft' ? 'Nháp' : entry.status === 'posted' ? 'Đã ghi' : entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewDetail(entry)}
                          data-testid={`view-journal-${entry.entry_number}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {entry.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePost(entry)}
                              className="text-green-600 hover:text-green-700"
                              data-testid={`post-journal-${entry.entry_number}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(entry)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`delete-journal-${entry.entry_number}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo bút toán mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journal_type">Loại bút toán</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.journal_type}
                    onValueChange={(value) => setFormData({ ...formData, journal_type: value })}
                  >
                    <SelectTrigger data-testid="journal-type-select" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {journalTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => applyTemplate(formData.journal_type)}
                    title="Áp dụng mẫu bút toán"
                    data-testid="apply-template-btn"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nhấn <Sparkles className="w-3 h-3 inline text-yellow-500" /> để tự động điền mẫu
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Số tham chiếu</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Mã chứng từ gốc"
                  data-testid="journal-reference-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Diễn giải</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nội dung bút toán"
                data-testid="journal-description-input"
              />
            </div>

            {/* Journal Lines */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Chi tiết bút toán</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm dòng
                </Button>
              </div>
              
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Tài khoản</TableHead>
                      <TableHead>Diễn giải</TableHead>
                      <TableHead className="w-32 text-right">Nợ</TableHead>
                      <TableHead className="w-32 text-right">Có</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={line.account_id}
                            onValueChange={(value) => updateLine(index, 'account_id', value)}
                          >
                            <SelectTrigger className="h-8" data-testid={`line-account-${index}`}>
                              <SelectValue placeholder="Chọn TK" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                            placeholder="Diễn giải"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(index, 'debit', e.target.value)}
                            data-testid={`line-debit-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(index, 'credit', e.target.value)}
                            data-testid={`line-credit-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          {formData.lines.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeLine(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={2} className="text-right">Tổng cộng:</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalCredit)}
                      </TableCell>
                      <TableCell>
                        {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-destructive text-xs">≠</span>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="save-journal-btn">
                Tạo bút toán
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Chi tiết bút toán: {selectedEntry?.entry_number}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Loại:</span>
                  <span className="ml-2 font-medium">{getJournalTypeInfo(selectedEntry.journal_type).label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge className={`ml-2 ${statusColors[selectedEntry.status]}`}>
                    {selectedEntry.status === 'draft' ? 'Nháp' : 'Đã ghi'}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Tham chiếu:</span>
                  <span className="ml-2">{selectedEntry.reference || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngày tạo:</span>
                  <span className="ml-2">{formatDate(selectedEntry.created_at)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Diễn giải:</span>
                  <span className="ml-2">{selectedEntry.description || '-'}</span>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã TK</TableHead>
                      <TableHead>Tên tài khoản</TableHead>
                      <TableHead className="text-right">Nợ</TableHead>
                      <TableHead className="text-right">Có</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEntry.lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{line.account_code}</TableCell>
                        <TableCell>{line.account_name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={2}>Tổng cộng</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(selectedEntry.total_debit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(selectedEntry.total_credit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
