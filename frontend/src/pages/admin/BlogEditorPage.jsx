import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Editor } from '@tinymce/tinymce-react';
import { toast } from 'sonner';
import { Save, X, ArrowLeft, Image as ImageIcon, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BlogEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        feature_image: '',
        category: 'news',
        tags: [],
        is_published: true
    });

    useEffect(() => {
        if (isEdit) {
            fetchBlog();
        }
    }, [id]);

    const fetchBlog = async () => {
        try {
            const blogs = await adminAPI.getBlogs();
            const blog = blogs.data.find(b => b.id === id);
            if (blog) {
                setFormData(blog);
            } else {
                toast.error('Không tìm thấy bài viết');
                navigate('/admin/blogs');
            }
        } catch (error) {
            toast.error('Lỗi khi tải bài viết');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.slug) {
            toast.error('Vui lòng nhập tiêu đề và slug');
            return;
        }

        setSaving(true);
        try {
            if (isEdit) {
                await adminAPI.updateBlog(id, formData);
                toast.success('Đã cập nhật bài viết');
            } else {
                await adminAPI.createBlog(formData);
                toast.success('Đã tạo bài viết mới');
            }
            navigate('/admin/blogs');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Lỗi khi lưu bài viết');
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = (text) => {
        const slug = text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/([^0-9a-z-\s])/g, '')
            .replace(/(\s+)/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        setFormData({ ...formData, slug });
    };

    if (loading) return <div className="p-8 text-center text-gray-500 italic">Đang tải dữ liệu...</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-50/50">
            {/* Header Toolbar */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blogs')} className="rounded-full">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
                        </h1>
                        <p className="text-xs text-muted-foreground">ID: {isEdit ? id : 'Sẽ tự động tạo'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-4 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Switch
                            checked={formData.is_published}
                            onCheckedChange={(val) => setFormData({ ...formData, is_published: val })}
                        />
                        <span className="text-sm font-medium">{formData.is_published ? 'Đã đăng' : 'Bản nháp'}</span>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/admin/blogs')} className="gap-2">
                        <X size={18} /> Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary px-6">
                        <Save size={18} /> {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Đăng bài')}
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardContent className="p-0">
                                <Tabs defaultValue="content" className="w-full">
                                    <div className="px-6 pt-4 border-b bg-white">
                                        <TabsList className="bg-muted/50 p-1 mb-2">
                                            <TabsTrigger value="content" className="gap-2">
                                                <Globe className="w-4 h-4" /> Nội dung chính
                                            </TabsTrigger>
                                            <TabsTrigger value="settings" className="gap-2">
                                                <ImageIcon className="w-4 h-4" /> SEO & Hình ảnh
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="content" className="m-0">
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="title" className="text-base font-semibold">Tiêu đề bài viết</Label>
                                                    <Input
                                                        id="title"
                                                        value={formData.title}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, title: e.target.value });
                                                            if (!isEdit) generateSlug(e.target.value);
                                                        }}
                                                        placeholder="Nhập tiêu đề thu hút người đọc..."
                                                        className="text-lg h-12 border-gray-200 focus:border-primary"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="slug" className="text-sm">Đường dẫn (Slug)</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="slug"
                                                            value={formData.slug}
                                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                            placeholder="ví-du-slug-bai-viet"
                                                            className="font-mono text-sm bg-gray-50"
                                                        />
                                                        <Button variant="outline" size="sm" onClick={() => generateSlug(formData.title)}>
                                                            Làm mới
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-4">
                                                    <Label className="text-base font-semibold">Nội dung bài viết</Label>
                                                    <div className="border rounded-xl overflow-hidden shadow-inner">
                                                        <Editor
                                                            apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
                                                            init={{
                                                                height: 600,
                                                                menubar: true,
                                                                plugins: [
                                                                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                                                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                                                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                                                ],
                                                                toolbar: 'undo redo | blocks | ' +
                                                                    'bold italic forecolor | alignleft aligncenter ' +
                                                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                                                    'image media table | removeformat | help',
                                                                content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }',
                                                                skin: 'oxide-dark',
                                                                content_css: 'dark',
                                                            }}
                                                            value={formData.content}
                                                            onEditorChange={(content) => setFormData({ ...formData, content })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="settings" className="m-0">
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="excerpt" className="text-base font-semibold">Tóm tắt ngắn (Excerpt)</Label>
                                                <textarea
                                                    id="excerpt"
                                                    value={formData.excerpt}
                                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                                    className="w-full min-h-[120px] p-3 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm leading-relaxed"
                                                    placeholder="Viết một đoạn ngắn giới thiệu về bài viết này..."
                                                />
                                                <p className="text-xs text-muted-foreground text-right">{formData.excerpt.length}/300 ký tự</p>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-base font-semibold">Ảnh đại diện bài viết</Label>
                                                <Input
                                                    value={formData.feature_image}
                                                    onChange={(e) => setFormData({ ...formData, feature_image: e.target.value })}
                                                    placeholder="Dán link ảnh tại đây (URL)..."
                                                />
                                                {formData.feature_image && (
                                                    <div className="mt-4 aspect-video rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center">
                                                        <img
                                                            src={formData.feature_image}
                                                            alt="Preview"
                                                            className="max-w-full max-h-full object-contain"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/800x450?text=Loi+anh';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Sidebar Settings */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardHeader className="bg-white border-b py-4">
                                <CardTitle className="text-base font-bold">Phân loại & Gắn thẻ</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-sm font-medium">Danh mục</Label>
                                    <select
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="news">Tin tức</option>
                                        <option value="guide">Hướng dẫn & Mẹo</option>
                                        <option value="promo">Khuyến mãi</option>
                                        <option value="review">Đánh giá sản phẩm</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tags" className="text-sm font-medium">Tags (Nhanh, cách nhau bằng dấu phẩy)</Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags.join(', ')}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                                        placeholder="robot, thong minh, mivietnam..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20 shadow-none">
                            <CardContent className="p-6">
                                <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                    <ArrowLeft size={14} className="rotate-180" /> Mẹo viết bài
                                </h3>
                                <ul className="text-xs space-y-2 text-primary/80 list-disc pl-4">
                                    <li>Tiêu đề nên chứa từ khóa liên quan đến sản phẩm.</li>
                                    <li>Ảnh đại diện nên có tỷ lệ 16:9 cho hiển thị đẹp nhất.</li>
                                    <li>Sử dụng các Heading (blocks) để cấu trúc bài viết rõ ràng.</li>
                                    <li>Gắn thẻ các thương hiệu liên quan để dễ tìm kiếm.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
