import "@/App.css";
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";

// Layouts
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StoreLayout } from "@/components/layout/StoreLayout";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Admin Pages
import DashboardPage from "@/pages/admin/DashboardPage";
import ProductsPage from "@/pages/admin/ProductsPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import BrandsPage from "@/pages/admin/BrandsPage";
import WarehousesPage from "@/pages/admin/WarehousesPage";
import InventoryPage from "@/pages/admin/InventoryPage";
import SerialsPage from "@/pages/admin/SerialsPage";
import CustomersPage from "@/pages/admin/CustomersPage";
import SalesPage from "@/pages/admin/SalesPage";
import AccountsPage from "@/pages/admin/AccountsPage";
import JournalPage from "@/pages/admin/JournalPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import StoreSettingsPage from "@/pages/admin/StoreSettingsPage";

// Store Pages
import HomePage from "@/pages/store/HomePage";
import ProductsListPage from "@/pages/store/ProductsListPage";
import ProductDetailPage from "@/pages/store/ProductDetailPage";

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Routes - Wrapped in AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="brands" element={<BrandsPage />} />
              <Route path="warehouses" element={<WarehousesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="serials" element={<SerialsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<StoreSettingsPage />} />

              {/* Future Modules */}
              <Route path="repairs" element={<DashboardPage />} />
              <Route path="recruitment" element={<DashboardPage />} />
            </Route>

            {/* Store Routes */}
            <Route path="/" element={<StoreLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsListPage />} />
              <Route path="products/:slug" element={<ProductDetailPage />} />
              <Route path="contact" element={<HomePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
