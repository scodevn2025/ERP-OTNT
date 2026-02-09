import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MoreHorizontal,
    UserCheck,
    UserX,
    Shield,
    Trash2,
    Search,
    Mail,
    Phone,
    UserPlus,
    RefreshCcw,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export default function UsersManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'staff'
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getUsers();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUserData.email || !newUserData.password || !newUserData.full_name) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setIsCreating(true);
            await adminAPI.createUser(newUserData);
            toast.success('Thêm nhân viên thành công');
            setIsAddDialogOpen(false);
            setNewUserData({ email: '', password: '', full_name: '', phone: '', role: 'staff' });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Không thể thêm nhân viên');
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = !user.is_active;
            await adminAPI.updateUser(user.id, { is_active: newStatus });
            toast.success(`${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công`);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Thao tác thất bại');
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        try {
            await adminAPI.updateUser(userId, { role: newRole });
            toast.success('Cập nhật vai trò thành công');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Cập nhật thất bại');
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Bạn có chắc muốn xóa người dùng ${user.full_name}?`)) return;
        try {
            await adminAPI.deleteUser(user.id);
            toast.success('Xóa người dùng thành công');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Xóa thất bại');
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return <Badge className="bg-purple-600">Admin</Badge>;
            case 'manager': return <Badge className="bg-blue-600">Quản lý</Badge>;
            case 'staff': return <Badge className="bg-green-600">Nhân viên</Badge>;
            case 'technician': return <Badge className="bg-orange-600">Kỹ thuật</Badge>;
            default: return <Badge variant="outline">{role}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý tài khoản, vai trò và trạng thái hoạt động của hệ thống</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
                        <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                        <UserPlus size={18} /> Thêm nhân viên
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-white border-b pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Tìm tên hoặc email nhân viên..."
                                className="pl-10 h-10 border-gray-200 focus:ring-primary focus:border-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <AlertCircle size={14} />
                            Tổng cộng: <span className="font-bold text-foreground">{users.length}</span> nhân viên
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && users.length === 0 ? (
                        <div className="py-20 text-center text-gray-400 italic">Đang tải danh sách nhân viên...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="w-[30%]">Họ tên & ID</TableHead>
                                        <TableHead>Vai trò</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Thông tin liên hệ</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-gray-400 italic">
                                                {searchTerm ? 'Không tìm thấy nhân viên nào khớp với từ khóa' : 'Chưa có nhân viên nào trong hệ thống'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{user.full_name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5 opacity-60">ID: {user.id.split('-')[0]}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                                <TableCell>
                                                    {user.is_active ? (
                                                        <Badge variant="success" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-medium">Hoạt động</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-medium">Đã khóa</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Mail size={14} className="text-gray-400" />
                                                            <span className="hover:text-primary transition-colors cursor-pointer">{user.email}</span>
                                                        </div>
                                                        {user.phone && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Phone size={14} className="text-gray-400" /> {user.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 p-2 shadow-xl border-gray-200">
                                                            <p className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b mb-1">Thao tác tài khoản</p>
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleStatus(user)}
                                                                className={user.is_active ? 'text-red-600 focus:bg-red-50 focus:text-red-600' : 'text-green-600 focus:bg-green-50 focus:text-green-600'}
                                                            >
                                                                {user.is_active ? (
                                                                    <><UserX className="mr-2 h-4 w-4" /> Vô hiệu hóa</>
                                                                ) : (
                                                                    <><UserCheck className="mr-2 h-4 w-4" /> Kích hoạt</>
                                                                )}
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="my-1" />
                                                            <p className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phân quyền</p>
                                                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'admin')} className="gap-2">
                                                                <Shield className="w-4 h-4 text-purple-600" /> Cấp quyền Admin
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'manager')} className="gap-2">
                                                                <Shield className="w-4 h-4 text-blue-600" /> Cấp quyền Quản lý
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'staff')} className="gap-2">
                                                                <Shield className="w-4 h-4 text-green-600" /> Cấp quyền Nhân viên
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'technician')} className="gap-2">
                                                                <Shield className="w-4 h-4 text-orange-600" /> Cấp quyền Kỹ thuật
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator className="my-1" />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Xóa tài khoản vĩnh viễn
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add User Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Thêm nhân viên mới</DialogTitle>
                        <DialogDescription>
                            Tạo tài khoản mới cho nhân viên. Họ có thể đăng nhập bằng email này.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Họ và tên <span className="text-red-500">*</span></Label>
                            <Input
                                id="full_name"
                                value={newUserData.full_name}
                                onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                                placeholder="Nguyen Van A"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email đăng nhập <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUserData.email}
                                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                placeholder="nhanvien@otnt.vn"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Mật khẩu ban đầu <span className="text-red-500">*</span></Label>
                            <Input
                                id="password"
                                type="password"
                                value={newUserData.password}
                                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                placeholder="********"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                value={newUserData.phone}
                                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                                placeholder="09xx xxx xxx"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Vai trò</Label>
                            <select
                                id="role"
                                value={newUserData.role}
                                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary outline-none text-sm"
                            >
                                <option value="staff">Nhân viên</option>
                                <option value="technician">Kỹ thuật viên</option>
                                <option value="manager">Quản lý</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleCreateUser} disabled={isCreating} className="bg-primary hover:bg-primary/90">
                            {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
