# Walkthrough: Premium ERP Redesign (ERP OTNT)

This document serves as the source of truth for the "Premium" state of the ERP OTNT project. It ensures that any AI agent or developer can quickly grasp the current UI/UX transformations and data structure.

## 1. Vision & Aesthetics
The "Premium" redesign focuses on a high-end, professional look inspired by modern tech storefronts (like Dreame).
- **Theme**: Deep Professional Slate (#111827) with semi-transparent elements and subtle blur (glassmorphism).
- **Branding**: "DREAME OFFICIAL" with high-quality banners and product imagery.
- **Typography**: Focused on clean, modern fonts implemented via Tailwind CSS.

## 2. Data Infrastructure
The system uses **MongoDB** as the primary data store for the storefront and product catalog.
- **Sample Data**: High-quality product data (Dreame X50 Ultra, X40 Ultra, etc.) sourced from Dreame AU.
- **Currency**: Automated AUD to VND conversion (1 AUD = 16,500 VND).
- **Seed Script**: `backend/seed_premium_data.py` - Run this to reset the database with premium assets and configurations.

## 3. Key Components
- **`frontend/src/components/layout/StoreLayout.jsx`**: Main layout for the premium storefront.
- **`frontend/src/pages/store/HomePage.jsx`**: Features the hero banners and product showcases.
- **`frontend/src/contexts/StoreContext.js`**: Manages global store state, branding, and dynamic banners.
- **`backend/seed_premium_data.py`**: Configures `site_name`, `tagline`, `primary_color`, and `hero_banners`.

## 4. Product Management Enhancements
We have upgraded the product creation and editing experience:
- **Rich Text Editor**: Integrated TinyMCE into the Admin's Product Management page.
- **Detailed Information**: Allows formatting of descriptions, tables, and media for premium product showcases.
- **Component**: `frontend/src/pages/admin/ProductsPage.jsx` now uses `@tinymce/tinymce-react`.

## 5. Deployment Flow
The premium redesign requires a specific deployment sequence to ensure frontend assets and backend data are synchronized.
- **Script**: `deploy_redesign.py`
- **Actions**:
  1. Uploads updated React components and backend scripts.
  2. Uploads banner images to `/home/clp/htdocs/erp_v2/frontend/public/banners/`.
  3. Rebuilds the frontend (`npm run build`).
  4. Restarts the `erp-backend` systemd service.
  5. Executes `seed_premium_data.py` on the server.

## 5. Verification Checklist for AI Agents
- [ ] Check `backend/seed_premium_data.py` for current product list and prices.
- [ ] Verify `frontend/src/contexts/StoreContext.js` to see how banners are loaded.
- [ ] Check `deploy_redesign.py` to ensure all new assets are listed for upload.
