import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Package,
  Layers,
  Award,
  AlertTriangle,
  TrendingUp,
  Database,
  Bot,
  Home,
  Wrench,
  Puzzle,
  Settings,
  Warehouse,
  DollarSign,
  ArrowUpRight,
  ShoppingCart,
  Users,
  FileText,
} from 'lucide-react';
import { PRODUCT_TYPES, formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...');
      const response = await adminAPI.getStats();
      console.log('Stats received:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Không thể tải thống kê Dashboard');
      setStats({
        total_products: 0,
        total_warehouses: 0,
        total_brands: 0,
        total_stock_value: 0,
        products_by_type: {},
        low_stock_count: 0,
        total_customers: 0,
        total_orders: 0,
        pending_orders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedData = async () => {
    try {
      await adminAPI.seedData();
      toast.success('Dữ liệu mẫu đã được tạo!');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Lỗi khi tạo dữ liệu mẫu');
    }
  };

  const statCards = [
    { title: 'Tổng sản phẩm', value: stats?.total_products || 0, icon: Package, color: 'bg-blue-500', lightColor: 'bg-blue-50 text-blue-600' },
    { title: 'Kho hàng', value: stats?.total_warehouses || 0, icon: Warehouse, color: 'bg-cyan-500', lightColor: 'bg-cyan-50 text-cyan-600' },
    { title: 'Khách hàng', value: stats?.total_customers || 0, icon: Users, color: 'bg-violet-500', lightColor: 'bg-violet-50 text-violet-600' },
    { title: 'Giá trị tồn kho', value: formatCurrency(stats?.total_stock_value || 0), icon: DollarSign, color: 'bg-emerald-500', lightColor: 'bg-emerald-50 text-emerald-600', isText: true },
  ];

  const productTypeIcons = {
    robot: Bot,
    goods: Home,
    accessory: Puzzle,
    part: Settings,
    service: Wrench,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hệ thống OTNT ERP</p>
        </div>
        <Button onClick={handleSeedData} variant="outline" className="shadow-sm" data-testid="seed-data-btn">
          <Database className="w-4 h-4 mr-2" />
          Tạo dữ liệu mẫu
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border bg-white shadow-sm hover:shadow-md transition-all duration-300" data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className={`font-heading font-bold text-foreground ${stat.isText ? 'text-xl' : 'text-3xl'}`}>{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl ${stat.lightColor} flex items-center justify-center`}>
                  <stat.icon className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                <p className="font-heading text-2xl font-bold text-foreground">{stats?.total_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn chờ xử lý</p>
                <p className="font-heading text-2xl font-bold text-foreground">{stats?.pending_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thương hiệu</p>
                <p className="font-heading text-2xl font-bold text-foreground">{stats?.total_brands || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products by Type & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Type */}
        <Card className="border-border bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              Sản phẩm theo loại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(PRODUCT_TYPES).map(([key, type]) => {
                const count = stats?.products_by_type?.[key] || 0;
                const Icon = productTypeIcons[key] || Package;
                const maxCount = Math.max(...Object.values(stats?.products_by_type || { x: 1 }), 1);
                const percentage = (count / maxCount) * 100;
                
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${type.color} border`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground">{type.label}</span>
                        <span className="text-sm font-semibold text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-border bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cảnh báo tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48">
              {stats?.low_stock_count > 0 ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4 shadow-inner">
                    <span className="font-heading text-4xl font-bold text-amber-600">{stats.low_stock_count}</span>
                  </div>
                  <p className="text-muted-foreground text-center">
                    sản phẩm có tồn kho thấp (dưới 5)
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <a href="/admin/inventory">
                      Xem chi tiết
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4 shadow-inner">
                    <Package className="w-12 h-12 text-emerald-600" />
                  </div>
                  <p className="text-muted-foreground text-center font-medium">
                    Kho hàng ổn định
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Không có sản phẩm sắp hết
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-white shadow-sm mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-foreground">Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-6 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all" asChild>
              <a href="/admin/products">
                <Package className="w-7 h-7" />
                <span className="font-medium">Thêm sản phẩm</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all" asChild>
              <a href="/admin/categories">
                <Layers className="w-7 h-7" />
                <span className="font-medium">Quản lý danh mục</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all" asChild>
              <a href="/admin/sales">
                <ShoppingCart className="w-7 h-7" />
                <span className="font-medium">Tạo đơn hàng</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all" asChild>
              <a href="/">
                <TrendingUp className="w-7 h-7" />
                <span className="font-medium">Xem Storefront</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
