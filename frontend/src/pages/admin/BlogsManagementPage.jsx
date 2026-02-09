import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BlogsManagementPage() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const res = await adminAPI.getBlogs();
            setBlogs(res.data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
        try {
            await adminAPI.deleteBlog(id);
            toast.success('Đã xóa bài viết');
            fetchBlogs();
        } catch (error) {
            toast.error('Lỗi khi xóa bài viết');
        }
    };

    const filteredBlogs = blogs.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="text-primary" /> Quản Lý Bài Viết
                    </h1>
                    <p className="text-muted-foreground text-sm">Quản lý nội dung tin tức, hướng dẫn và quảng cáo bài viết.</p>
                </div>
                <Button onClick={() => navigate('/admin/blogs/new')} className="gap-2">
                    <Plus size={18} /> Viết Bài Mới
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Tìm kiếm bài viết..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-hidden rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left font-medium">Hình ảnh</th>
                                    <th className="p-3 text-left font-medium">Tiêu đề</th>
                                    <th className="p-3 text-left font-medium">Danh mục</th>
                                    <th className="p-3 text-left font-medium">Trạng thái</th>
                                    <th className="p-3 text-left font-medium">Lượt xem</th>
                                    <th className="p-3 text-left font-medium">Ngày viết</th>
                                    <th className="p-3 text-right font-medium">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredBlogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-muted-foreground">
                                            Không tìm thấy bài viết nào
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBlogs.map((blog) => (
                                        <tr key={blog.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3">
                                                <div className="w-16 h-10 rounded overflow-hidden bg-gray-100">
                                                    {blog.feature_image ? (
                                                        <img src={blog.feature_image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <FileText size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 max-w-xs">
                                                <p className="font-medium line-clamp-1">{blog.title}</p>
                                                <p className="text-xs text-muted-foreground">/{blog.slug}</p>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="capitalize">{blog.category}</Badge>
                                            </td>
                                            <td className="p-3">
                                                {blog.is_published ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Đã đăng</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Bản nháp</Badge>
                                                )}
                                            </td>
                                            <td className="p-3 flex items-center gap-1 text-muted-foreground">
                                                <Eye size={14} /> {blog.view_count || 0}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(blog.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}>
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(blog.id)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
