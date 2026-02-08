import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, RefreshCw } from 'lucide-react';
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

const accountTypes = [
  { value: 'asset', label: 'Tài sản', color: 'bg-blue-500' },
  { value: 'liability', label: 'Nợ phải trả', color: 'bg-orange-500' },
  { value: 'equity', label: 'Vốn chủ sở hữu', color: 'bg-purple-500' },
  { value: 'revenue', label: 'Doanh thu', color: 'bg-green-500' },
  { value: 'expense', label: 'Chi phí', color: 'bg-red-500' },
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    account_type: 'asset',
    parent_id: '',
    description: '',
    is_header: false,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/accounts', {
        params: { include_balances: true }
      });
      setAccounts(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
      };
      
      if (editingAccount) {
        await api.put(`/admin/accounts/${editingAccount.id}`, payload);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await api.post('/admin/accounts', payload);
        toast.success('Tạo tài khoản thành công');
      }
      
      setShowDialog(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${account.name}"?`)) return;
    
    try {
      await api.delete(`/admin/accounts/${account.id}`);
      toast.success('Xóa tài khoản thành công');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể xóa tài khoản');
    }
  };

  const openEditDialog = (account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      account_type: account.account_type,
      parent_id: account.parent_id || '',
      description: account.description || '',
      is_header: account.is_header,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingAccount(null);
    setFormData({
      code: '',
      name: '',
      account_type: 'asset',
      parent_id: '',
      description: '',
      is_header: false,
    });
  };

  const filteredAccounts = accounts.filter(a => 
    filterType === 'all' || a.account_type === filterType
  );

  const headerAccounts = accounts.filter(a => a.is_header);

  const getAccountTypeInfo = (type) => {
    return accountTypes.find(t => t.value === type) || { label: type, color: 'bg-gray-500' };
  };

  return (
    <div className="space-y-6" data-testid="accounts-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Sổ Tài Khoản (COA)</h1>
          <p className="text-muted-foreground">Quản lý hệ thống tài khoản kế toán</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAccounts} data-testid="refresh-accounts">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} data-testid="add-account-btn">
            <Plus className="w-4 h-4 mr-2" />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            Tất cả
          </Button>
          {accountTypes.map(type => (
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
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Mã TK</TableHead>
              <TableHead>Tên tài khoản</TableHead>
              <TableHead className="w-32">Loại</TableHead>
              <TableHead className="w-40 text-right">Số dư</TableHead>
              <TableHead className="w-24 text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Không có tài khoản nào
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => {
                const typeInfo = getAccountTypeInfo(account.account_type);
                return (
                  <TableRow key={account.id} className={account.is_header ? 'bg-muted/30 font-semibold' : ''}>
                    <TableCell className="font-mono">
                      {account.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {account.parent_id && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        <span>{account.name}</span>
                        {account.is_header && (
                          <Badge variant="outline" className="text-xs">Header</Badge>
                        )}
                      </div>
                      {account.description && (
                        <p className="text-xs text-muted-foreground mt-1">{account.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${typeInfo.color} text-white`}>
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {!account.is_header && formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(account)}
                          data-testid={`edit-account-${account.code}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`delete-account-${account.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã tài khoản *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VD: 111"
                  required
                  data-testid="account-code-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_type">Loại tài khoản *</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                >
                  <SelectTrigger data-testid="account-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Tên tài khoản *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Tiền mặt"
                required
                data-testid="account-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Tài khoản cha</Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger data-testid="parent-account-select">
                  <SelectValue placeholder="Chọn tài khoản cha (nếu có)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {headerAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả tài khoản"
                data-testid="account-description-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_header"
                checked={formData.is_header}
                onChange={(e) => setFormData({ ...formData, is_header: e.target.checked })}
                className="rounded border-border"
                data-testid="is-header-checkbox"
              />
              <Label htmlFor="is_header" className="font-normal">
                Là tài khoản tổng hợp (Header)
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" data-testid="save-account-btn">
                {editingAccount ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
