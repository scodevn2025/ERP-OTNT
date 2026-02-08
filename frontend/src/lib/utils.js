import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}

export function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Split accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start
        .replace(/-+$/, ''); // Trim - from end
}

export const PRODUCT_TYPES = {
    robot: { label: 'Robot', color: 'bg-blue-500/15 text-blue-400' },
    goods: { label: 'Gia dụng', color: 'bg-green-500/15 text-green-400' },
    accessory: { label: 'Phụ kiện', color: 'bg-amber-500/15 text-amber-400' },
    part: { label: 'Linh kiện', color: 'bg-purple-500/15 text-purple-400' },
    service: { label: 'Dịch vụ', color: 'bg-rose-500/15 text-rose-400' },
};
