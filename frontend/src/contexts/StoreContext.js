import React, { createContext, useContext, useState, useEffect } from 'react';
import { storeAPI } from '@/lib/api';

const StoreContext = createContext();

export function StoreProvider({ children }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await storeAPI.getConfig();
            const config = response.data;
            setSettings(config);

            // Inject CSS Variables for Dynamic Branding
            if (typeof document !== 'undefined') {
                if (config.primary_color) {
                    document.documentElement.style.setProperty('--primary', hexToHsl(config.primary_color));
                }
            }
        } catch (error) {
            console.error('Failed to load store settings', error);
            // Fallback settings if API fails
            setSettings({
                site_name: "ONG TRÙM NỘI TRỢ",
                tagline: "Robot hút bụi chính hãng",
                primary_color: "#dc2626",
                contact_phone: "0826.123.678",
                contact_email: "support@ongtrumnoitro.com",
                address: "123 Cầu Giấy, Hà Nội",
                hero_banners: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <StoreContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </StoreContext.Provider>
    );
}

export const useStore = () => useContext(StoreContext);

/**
 * Helper to convert Hex to HSL for Tailwind CSS variable compatibility
 * Shadcn-ui uses HSL variables in its CSS.
 */
function hexToHsl(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `${h} ${s}% ${l}%`;
}
