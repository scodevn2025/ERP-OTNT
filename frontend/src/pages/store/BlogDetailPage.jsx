import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storeAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar, User, Eye, Share2, Facebook, Twitter, Link as LinkIcon } from 'lucide-react';

export default function BlogDetailPage() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [related, setRelated] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await storeAPI.getBlog(slug);
                setBlog(res.data);

                // Fetch related blogs of same category
                const relRes = await storeAPI.getBlogs({ category: res.data.category, limit: 3 });
                setRelated(relRes.data.filter(b => b.slug !== slug));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) return <div className="py-20 text-center italic text-gray-500">Đang tải nội dung...</div>;
    if (!blog) return <div className="py-20 text-center">Không tìm thấy bài viết</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Simple Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <Link to="/" className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 transition-colors">
                    <ChevronLeft size={16} /> Trang chủ / Tin tức
                </Link>
            </div>

            <main className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Hero Image */}
                        <div className="aspect-[21/9] w-full overflow-hidden relative">
                            <img
                                src={blog.feature_image || 'https://via.placeholder.com/1200x500'}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                                <Badge className="w-fit mb-4 bg-primary border-none text-white px-3 py-1 uppercase text-[10px] tracking-widest font-bold">
                                    {blog.category === 'guide' ? 'Hướng dẫn' : blog.category === 'promo' ? 'Khuyến mãi' : 'Tin tức'}
                                </Badge>
                                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-lg">
                                    {blog.title}
                                </h1>
                            </div>
                        </div>

                        {/* Article Info */}
                        <div className="px-8 py-6 border-b flex flex-wrap items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-2"><Calendar size={16} className="text-primary" /> {new Date(blog.created_at).toLocaleDateString('vi-VN')}</span>
                            <span className="flex items-center gap-2"><User size={16} className="text-primary" /> Biên tập viên OTNT</span>
                            <span className="flex items-center gap-2"><Eye size={16} className="text-primary" /> {blog.view_count || 0} lượt đọc</span>
                            <div className="ml-auto flex gap-2">
                                <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 text-blue-600 hover:bg-blue-50"><Facebook size={16} /></Button>
                                <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 text-sky-500 hover:bg-sky-50"><Twitter size={16} /></Button>
                                <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 text-gray-400 hover:bg-gray-50" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Đã sao chép liên kết');
                                }}><LinkIcon size={16} /></Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-10 prose prose-lg prose-primary max-w-none">
                            <div className="text-gray-600 leading-relaxed font-body" dangerouslySetInnerHTML={{ __html: blog.content }} />
                        </div>

                        {/* Footer TAGS */}
                        {blog.tags?.length > 0 && (
                            <div className="px-8 pb-10 flex flex-wrap gap-2">
                                {blog.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-gray-400 text-[10px] uppercase font-bold hover:border-primary hover:text-primary transition-colors cursor-pointer">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </article>

                    {/* Related Post Section */}
                    {related.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-primary rounded-full" /> BÀI VIẾT LIÊN QUAN
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {related.map(item => (
                                    <Link key={item.id} to={`/blog/${item.slug}`} className="group">
                                        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                                            <div className="aspect-video overflow-hidden">
                                                <img src={item.feature_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="p-4 flex-1">
                                                <h3 className="font-bold text-sm text-gray-800 line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
