import { useState, useEffect, useCallback } from 'react';
import { adminAPI, API_BASE } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Upload,
    Image,
    Trash2,
    Copy,
    Search,
    Grid,
    List,
    Check,
    X,
    Loader2,
    Download,
    ExternalLink
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function MediaManagerPage() {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const fetchMedia = useCallback(async () => {
        try {
            setLoading(true);
            const [mediaRes, countRes] = await Promise.all([
                adminAPI.getMedia({ limit: 100 }),
                adminAPI.getMediaCount()
            ]);
            setMedia(mediaRes.data);
            setTotalCount(countRes.data.count);
        } catch (error) {
            console.error('Failed to fetch media:', error);
            toast.error('Không thể tải danh sách media');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const invalidFiles = fileArray.filter(f => !allowedTypes.includes(f.type));

        if (invalidFiles.length > 0) {
            toast.error(`Định dạng không hỗ trợ: ${invalidFiles.map(f => f.name).join(', ')}`);
            return;
        }

        try {
            setUploading(true);
            const response = await adminAPI.uploadMedia(fileArray);
            toast.success(`Đã upload thành công ${response.data.count} file`);
            fetchMedia();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.detail || 'Upload thất bại');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;

        if (!window.confirm(`Xóa ${selectedItems.length} file đã chọn?`)) return;

        try {
            await Promise.all(selectedItems.map(id => adminAPI.deleteMedia(id)));
            toast.success(`Đã xóa ${selectedItems.length} file`);
            setSelectedItems([]);
            fetchMedia();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Xóa thất bại');
        }
    };

    const copyToClipboard = (url) => {
        const fullUrl = `${BACKEND_URL}${url}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success('Đã copy URL');
    };

    const toggleSelect = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredMedia = media.filter(item =>
        item.original_name.toLowerCase().includes(search.toLowerCase())
    );

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        handleFileUpload(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Media</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalCount} file đã upload
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedItems.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa ({selectedItems.length})
                        </Button>
                    )}
                    <label>
                        <Button
                            className="flex items-center gap-2 bg-primary hover:bg-red-600"
                            disabled={uploading}
                        >
                            {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {uploading ? 'Đang upload...' : 'Upload'}
                        </Button>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                        />
                    </label>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm file..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-1 border rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "p-2 rounded transition-colors",
                            viewMode === 'grid' ? "bg-primary text-white" : "hover:bg-gray-100"
                        )}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            "p-2 rounded transition-colors",
                            viewMode === 'list' ? "bg-primary text-white" : "hover:bg-gray-100"
                        )}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                    dragOver
                        ? "border-primary bg-red-50"
                        : "border-gray-300 bg-gray-50 hover:border-primary/50"
                )}
            >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">
                    Kéo thả file vào đây hoặc click nút Upload
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    Hỗ trợ: JPG, PNG, GIF, WebP, SVG (tối đa 10MB)
                </p>
            </div>

            {/* Media Grid/List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredMedia.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                    <Image className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Chưa có media nào</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredMedia.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative bg-white rounded-xl border-2 overflow-hidden transition-all cursor-pointer",
                                selectedItems.includes(item.id)
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-gray-100 hover:border-primary/50"
                            )}
                            onClick={() => toggleSelect(item.id)}
                        >
                            {/* Checkbox */}
                            <div className={cn(
                                "absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                selectedItems.includes(item.id)
                                    ? "bg-primary border-primary text-white"
                                    : "bg-white border-gray-300 opacity-0 group-hover:opacity-100"
                            )}>
                                {selectedItems.includes(item.id) && <Check className="w-3 h-3" />}
                            </div>

                            {/* Image */}
                            <div className="aspect-square bg-gray-100">
                                <img
                                    src={`${BACKEND_URL}${item.url}`}
                                    alt={item.original_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(item.url);
                                    }}
                                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                    title="Copy URL"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <a
                                    href={`${BACKEND_URL}${item.url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                    title="Xem ảnh gốc"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            {/* Info */}
                            <div className="p-2">
                                <p className="text-xs font-medium text-gray-700 truncate" title={item.original_name}>
                                    {item.original_name}
                                </p>
                                <p className="text-[10px] text-gray-400">{formatFileSize(item.size)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-sm font-medium text-gray-600">
                            <tr>
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === filteredMedia.length && filteredMedia.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedItems(filteredMedia.map(m => m.id));
                                            } else {
                                                setSelectedItems([]);
                                            }
                                        }}
                                        className="rounded"
                                    />
                                </th>
                                <th className="p-4">Preview</th>
                                <th className="p-4">Tên file</th>
                                <th className="p-4">Loại</th>
                                <th className="p-4">Kích thước</th>
                                <th className="p-4">Ngày upload</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredMedia.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                                            <img
                                                src={`${BACKEND_URL}${item.url}`}
                                                alt={item.original_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-medium text-gray-800 truncate max-w-[200px]" title={item.original_name}>
                                            {item.original_name}
                                        </p>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">{item.content_type}</td>
                                    <td className="p-4 text-gray-500 text-sm">{formatFileSize(item.size)}</td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => copyToClipboard(item.url)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded transition-colors"
                                                title="Copy URL"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={`${BACKEND_URL}${item.url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded transition-colors"
                                                title="Xem ảnh gốc"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Xóa file này?')) {
                                                        await adminAPI.deleteMedia(item.id);
                                                        toast.success('Đã xóa');
                                                        fetchMedia();
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
