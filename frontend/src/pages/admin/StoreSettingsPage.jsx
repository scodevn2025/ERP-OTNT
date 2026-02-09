import React, { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Save,
    Settings,
    Palette,
    Info,
    Phone,
    Mail,
    MapPin,
    Globe,
    Plus,
    Trash2,
    Image as ImageIcon,
    Zap,
    Timer
} from 'lucide-react';

export default function StoreSettingsPage() {
    const { refreshSettings } = useStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        site_name: '',
        tagline: '',
        logo_url: '',
        primary_color: '#dc2626',
        contact_phone: '',
        contact_email: '',
        address: '',
        facebook_url: '',
        youtube_url: '',
        hero_banners: []
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await adminAPI.getStoreConfig();
            setConfig(response.data);
        } catch (error) {
            toast.error('Không thể tải cấu hình cửa hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminAPI.updateStoreConfig(config);
            toast.success('Đã cập nhật cấu hình cửa hàng!');
            refreshSettings(); // Update UI immediately
        } catch (error) {
            toast.error('Lỗi khi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const updateBanner = (index, field, value) => {
        const newBanners = [...config.hero_banners];
        newBanners[index][field] = value;
        setConfig({ ...config, hero_banners: newBanners });
    };

    const addBanner = () => {
        setConfig({
            ...config,
            hero_banners: [...config.hero_banners, { image_url: '', title: '', subtitle: '', link: '/' }]
        });
    };

    const removeBanner = (index) => {
        const newBanners = config.hero_banners.filter((_, i) => i !== index);
        setConfig({ ...config, hero_banners: newBanners });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải cấu hình...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 italic">
                        <Settings className="text-primary" /> Quản Lý Thương Hiệu & Storefront
                    </h1>
                    <p className="text-gray-500">Cấu hình tên, logo, màu sắc và giao diện cho cửa hàng của bạn.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary">
                    <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Info size={18} /> Thông Tin Cơ Bản</CardTitle>
                        <CardDescription>Tên hiển thị và slogan của website.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="site_name">Tên Store (Đối tác)</Label>
                            <Input
                                id="site_name"
                                value={config.site_name}
                                onChange={e => setConfig({ ...config, site_name: e.target.value })}
                                placeholder="VD: ONG TRÙM NỘI TRỢ"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tagline">Slogan / Tagline</Label>
                            <Input
                                id="tagline"
                                value={config.tagline}
                                onChange={e => setConfig({ ...config, tagline: e.target.value })}
                                placeholder="VD: Robot hút bụi chính hãng"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">Link Logo (Nếu có)</Label>
                            <Input
                                id="logo_url"
                                value={config.logo_url}
                                onChange={e => setConfig({ ...config, logo_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Branding & Design */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Palette size={18} /> Thiết Kế & Màu Sắc</CardTitle>
                        <CardDescription>Tùy chỉnh tông màu chính cho giao diện Storefront.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary_color">Màu sắc chủ đạo (Primary Color)</Label>
                            <div className="flex gap-4 items-center">
                                <Input
                                    id="primary_color"
                                    type="color"
                                    className="w-20 h-10 p-1 rounded cursor-pointer"
                                    value={config.primary_color}
                                    onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                                />
                                <span className="text-sm font-mono text-gray-500 uppercase">{config.primary_color}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 italic">Màu này sẽ áp dụng cho Header, Nút bấm và các điểm nhấn trên web.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="md:col-span-2 shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Globe size={18} /> Liên Hệ & Mạng Xã Hội</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><Phone size={14} /> Hotline</Label>
                                <Input value={config.contact_phone} onChange={e => setConfig({ ...config, contact_phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><Mail size={14} /> Email</Label>
                                <Input value={config.contact_email} onChange={e => setConfig({ ...config, contact_email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><MapPin size={14} /> Địa chỉ</Label>
                                <Input value={config.address} onChange={e => setConfig({ ...config, address: e.target.value })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hero Banners */}
                <Card className="md:col-span-2 shadow-sm border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg"><ImageIcon size={18} /> Banner Chính (Slider)</CardTitle>
                            <CardDescription>Các hình ảnh lớn chạy ở đầu trang chủ.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={addBanner} className="gap-1 border-primary text-primary">
                            <Plus size={16} /> Thêm Banner
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {config.hero_banners.map((banner, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-gray-50 relative group">
                                <div className="flex-1 space-y-3">
                                    <Input
                                        placeholder="Link hình ảnh (URL)"
                                        value={banner.image_url}
                                        onChange={e => updateBanner(index, 'image_url', e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Tiêu đề"
                                            value={banner.title}
                                            onChange={e => updateBanner(index, 'title', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Link điều hướng"
                                            value={banner.link}
                                            onChange={e => updateBanner(index, 'link', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                    onClick={() => removeBanner(index)}
                                >
                                    <Trash2 size={20} />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Promo Sections (Ads) */}
                <Card className="md:col-span-2 shadow-sm border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg"><Zap size={18} /> Quảng Cáo & Khuyến Mãi (3-Grid)</CardTitle>
                            <CardDescription>3 banner phụ hiển thị bên dưới banner chính.</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfig({ ...config, promo_sections: [...(config.promo_sections || []), { image_url: '', title: '', link: '', tag: '' }] })}
                            className="gap-1 border-primary text-primary"
                        >
                            <Plus size={16} /> Thêm Quảng Cáo
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(config.promo_sections || []).map((promo, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-gray-50 relative group">
                                <div className="flex-1 space-y-3">
                                    <Input
                                        placeholder="Link hình ảnh (Nên chọn 400x200)"
                                        value={promo.image_url}
                                        onChange={e => {
                                            const newPromos = [...config.promo_sections];
                                            newPromos[index].image_url = e.target.value;
                                            setConfig({ ...config, promo_sections: newPromos });
                                        }}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Tiêu đề / Tag (VD: 1 đổi 1)"
                                            value={promo.tag}
                                            onChange={e => {
                                                const newPromos = [...config.promo_sections];
                                                newPromos[index].tag = e.target.value;
                                                setConfig({ ...config, promo_sections: newPromos });
                                            }}
                                        />
                                        <Input
                                            placeholder="Link điều hướng"
                                            value={promo.link}
                                            onChange={e => {
                                                const newPromos = [...config.promo_sections];
                                                newPromos[index].link = e.target.value;
                                                setConfig({ ...config, promo_sections: newPromos });
                                            }}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                        const newPromos = config.promo_sections.filter((_, i) => i !== index);
                                        setConfig({ ...config, promo_sections: newPromos });
                                    }}
                                >
                                    <Trash2 size={20} />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Flash Sale Config */}
                <Card className="md:col-span-2 shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Timer size={18} /> Cấu Hình Flash Sale</CardTitle>
                        <CardDescription>Thời gian đếm ngược và trạng thái Flash Sale.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="flash_active"
                                    className="w-4 h-4 text-primary"
                                    checked={config.flash_sale?.is_active || false}
                                    onChange={e => setConfig({
                                        ...config,
                                        flash_sale: { ...(config.flash_sale || {}), is_active: e.target.checked }
                                    })}
                                />
                                <Label htmlFor="flash_active">Kích hoạt Flash Sale</Label>
                            </div>
                            <div className="flex-1">
                                <Label>Thời gian kết thúc (ISO hoặc YYYY-MM-DD HH:mm)</Label>
                                <Input
                                    value={config.flash_sale?.end_time || ''}
                                    onChange={e => setConfig({
                                        ...config,
                                        flash_sale: { ...(config.flash_sale || {}), end_time: e.target.value }
                                    })}
                                    placeholder="2025-12-31 23:59:59"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2 bg-primary px-8 h-12 text-lg">
                    <Save size={20} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </Button>
            </div>
        </div>
    );
}
