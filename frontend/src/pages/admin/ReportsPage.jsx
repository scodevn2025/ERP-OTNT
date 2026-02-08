import { useState, useEffect } from 'react';
import { RefreshCw, FileText, Package, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('trial-balance');
  const [trialBalance, setTrialBalance] = useState(null);
  const [inventoryValuation, setInventoryValuation] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (activeTab === 'trial-balance') fetchTrialBalance();
    else if (activeTab === 'inventory') fetchInventoryValuation();
    else if (activeTab === 'profit-loss') fetchProfitLoss();
  }, [activeTab, selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/admin/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/trial-balance');
      setTrialBalance(response.data);
    } catch (error) {
      toast.error('Không thể tải bảng cân đối thử');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryValuation = async () => {
    try {
      setLoading(true);
      const params = selectedWarehouse !== 'all' ? { warehouse_id: selectedWarehouse } : {};
      const response = await api.get('/admin/reports/inventory-valuation', { params });
      setInventoryValuation(response.data);
    } catch (error) {
      toast.error('Không thể tải báo cáo tồn kho');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitLoss = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/profit-loss');
      setProfitLoss(response.data);
    } catch (error) {
      toast.error('Không thể tải báo cáo lãi lỗ');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (activeTab === 'trial-balance') fetchTrialBalance();
    else if (activeTab === 'inventory') fetchInventoryValuation();
    else if (activeTab === 'profit-loss') fetchProfitLoss();
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Báo Cáo Tài Chính</h1>
          <p className="text-muted-foreground">Các báo cáo kế toán và tồn kho</p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={loading} data-testid="refresh-reports">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance" data-testid="tab-trial-balance">
            <FileText className="w-4 h-4 mr-2" />
            Bảng cân đối thử
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Package className="w-4 h-4 mr-2" />
            Giá trị tồn kho
          </TabsTrigger>
          <TabsTrigger value="profit-loss" data-testid="tab-profit-loss">
            <TrendingUp className="w-4 h-4 mr-2" />
            Lãi lỗ
          </TabsTrigger>
        </TabsList>

        {/* Trial Balance */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bảng Cân Đối Thử</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10">Đang tải...</div>
              ) : trialBalance ? (
                <div className="space-y-4">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Mã TK</TableHead>
                          <TableHead>Tên tài khoản</TableHead>
                          <TableHead className="w-28">Loại</TableHead>
                          <TableHead className="w-36 text-right">Nợ</TableHead>
                          <TableHead className="w-36 text-right">Có</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.accounts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Chưa có bút toán nào được ghi sổ
                            </TableCell>
                          </TableRow>
                        ) : (
                          trialBalance.accounts.map((acc) => (
                            <TableRow key={acc.account_id}>
                              <TableCell className="font-mono">{acc.account_code}</TableCell>
                              <TableCell>{acc.account_name}</TableCell>
                              <TableCell className="capitalize text-sm text-muted-foreground">
                                {acc.account_type === 'asset' ? 'Tài sản' :
                                 acc.account_type === 'liability' ? 'Nợ phải trả' :
                                 acc.account_type === 'equity' ? 'Vốn CSH' :
                                 acc.account_type === 'revenue' ? 'Doanh thu' : 'Chi phí'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {acc.debit > 0 ? formatCurrency(acc.debit) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {acc.credit > 0 ? formatCurrency(acc.credit) : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={3}>Tổng cộng</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(trialBalance.total_debit)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(trialBalance.total_credit)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${trialBalance.is_balanced ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {trialBalance.is_balanced ? '✓ Bảng cân đối thử đã cân bằng' : '✗ Bảng cân đối thử chưa cân bằng'}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Valuation */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Báo Cáo Giá Trị Tồn Kho</CardTitle>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-48" data-testid="warehouse-filter">
                  <SelectValue placeholder="Chọn kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kho</SelectItem>
                  {warehouses.map(wh => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10">Đang tải...</div>
              ) : inventoryValuation ? (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-muted/30">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Package className="w-8 h-8 text-blue-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Số mặt hàng</p>
                            <p className="text-2xl font-bold">{inventoryValuation.item_count}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-8 h-8 text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Tổng giá trị</p>
                            <p className="text-2xl font-bold">{formatCurrency(inventoryValuation.total_value)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Table */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Kho</TableHead>
                          <TableHead className="text-right">SL</TableHead>
                          <TableHead className="text-right">Giá TB</TableHead>
                          <TableHead className="text-right">Giá trị</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryValuation.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Không có dữ liệu tồn kho
                            </TableCell>
                          </TableRow>
                        ) : (
                          inventoryValuation.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{item.product_sku}</TableCell>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.warehouse_name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(item.avg_cost)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium">
                                {formatCurrency(item.total_value)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Báo Cáo Lãi Lỗ</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10">Đang tải...</div>
              ) : profitLoss ? (
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-green-600 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Doanh thu
                    </h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableBody>
                          {profitLoss.revenue.items.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                Chưa có doanh thu
                              </TableCell>
                            </TableRow>
                          ) : (
                            profitLoss.revenue.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <span className="font-mono mr-2">{item.account_code}</span>
                                  {item.account_name}
                                </TableCell>
                                <TableCell className="text-right font-mono w-40">
                                  {formatCurrency(item.amount)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                          <TableRow className="bg-green-500/10 font-semibold">
                            <TableCell>Tổng doanh thu</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(profitLoss.revenue.total)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Expense Section */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-red-600 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Chi phí
                    </h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableBody>
                          {profitLoss.expenses.items.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                Chưa có chi phí
                              </TableCell>
                            </TableRow>
                          ) : (
                            profitLoss.expenses.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <span className="font-mono mr-2">{item.account_code}</span>
                                  {item.account_name}
                                </TableCell>
                                <TableCell className="text-right font-mono w-40">
                                  {formatCurrency(item.amount)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                          <TableRow className="bg-red-500/10 font-semibold">
                            <TableCell>Tổng chi phí</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(profitLoss.expenses.total)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className={`p-4 rounded-lg text-center ${profitLoss.net_profit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <p className="text-sm text-muted-foreground mb-1">Lợi nhuận ròng</p>
                    <p className={`text-3xl font-bold ${profitLoss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitLoss.net_profit)}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
