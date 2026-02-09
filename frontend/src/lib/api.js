import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already on auth pages and not validating session
      const isAuthPage = window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register');
      const isProfileCheck = error.config?.url?.includes('/auth/me');

      if (!isAuthPage && !isProfileCheck) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
};

// Admin APIs
export const adminAPI = {
  // Dashboard
  getStats: () => api.get('/admin/dashboard/stats'),
  seedData: () => api.post('/admin/seed'),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Brands
  getBrands: () => api.get('/admin/brands'),
  createBrand: (data) => api.post('/admin/brands', data),
  updateBrand: (id, data) => api.put(`/admin/brands/${id}`, data),
  deleteBrand: (id) => api.delete(`/admin/brands/${id}`),

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Warehouses
  getWarehouses: () => api.get('/admin/warehouses'),
  getWarehouse: (id) => api.get(`/admin/warehouses/${id}`),
  createWarehouse: (data) => api.post('/admin/warehouses', data),
  updateWarehouse: (id, data) => api.put(`/admin/warehouses/${id}`, data),
  deleteWarehouse: (id) => api.delete(`/admin/warehouses/${id}`),

  // Inventory Documents
  getInventoryDocs: (params) => api.get('/admin/inventory/documents', { params }),
  getInventoryDoc: (id) => api.get(`/admin/inventory/documents/${id}`),
  createInventoryDoc: (data) => api.post('/admin/inventory/documents', data),
  postInventoryDoc: (id) => api.post(`/admin/inventory/documents/${id}/post`),
  deleteInventoryDoc: (id) => api.delete(`/admin/inventory/documents/${id}`),

  // Stock
  getStockBalance: (params) => api.get('/admin/inventory/stock', { params }),
  getStockLedger: (params) => api.get('/admin/inventory/ledger', { params }),

  // Serials
  getSerials: (params) => api.get('/admin/serials', { params }),
  getSerial: (id) => api.get(`/admin/serials/${id}`),
  createSerial: (data) => api.post('/admin/serials', data),
  getSerialMovements: (id) => api.get(`/admin/serials/${id}/movements`),

  // Customers
  getCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomer: (id) => api.get(`/admin/customers/${id}`),
  createCustomer: (data) => api.post('/admin/customers', data),
  updateCustomer: (id, data) => api.put(`/admin/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/admin/customers/${id}`),

  // Sales Orders
  getSalesOrders: (params) => api.get('/admin/sales/orders', { params }),
  getSalesOrder: (id) => api.get(`/admin/sales/orders/${id}`),
  createSalesOrder: (data) => api.post('/admin/sales/orders', data),
  confirmSalesOrder: (id) => api.post(`/admin/sales/orders/${id}/confirm`),
  completeSalesOrder: (id) => api.post(`/admin/sales/orders/${id}/complete`),
  cancelSalesOrder: (id) => api.post(`/admin/sales/orders/${id}/cancel`),
  deleteSalesOrder: (id) => api.delete(`/admin/sales/orders/${id}`),

  // Chart of Accounts
  getAccounts: (params) => api.get('/admin/accounts', { params }),
  getAccount: (id) => api.get(`/admin/accounts/${id}`),
  createAccount: (data) => api.post('/admin/accounts', data),
  updateAccount: (id, data) => api.put(`/admin/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/admin/accounts/${id}`),

  // Journal Entries
  getJournalEntries: (params) => api.get('/admin/journal-entries', { params }),
  getJournalEntry: (id) => api.get(`/admin/journal-entries/${id}`),
  createJournalEntry: (data) => api.post('/admin/journal-entries', data),
  postJournalEntry: (id) => api.post(`/admin/journal-entries/${id}/post`),
  deleteJournalEntry: (id) => api.delete(`/admin/journal-entries/${id}`),

  // Financial Reports
  getTrialBalance: () => api.get('/admin/reports/trial-balance'),
  getInventoryValuation: (params) => api.get('/admin/reports/inventory-valuation', { params }),
  getProfitLoss: () => api.get('/admin/reports/profit-loss'),

  // Store Configuration
  getStoreConfig: () => api.get('/admin/config'),
  updateStoreConfig: (data) => api.post('/admin/config', data),
};

// Store (Public) APIs
export const storeAPI = {
  getProducts: (params) => api.get('/store/products', { params }),
  getProduct: (slug) => api.get(`/store/products/${slug}`),
  getCategories: () => api.get('/store/categories'),
  getBrands: () => api.get('/store/brands'),
  getConfig: () => api.get('/store/config'),
};

export default api;
