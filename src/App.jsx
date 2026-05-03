import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import ScrollToTop from './components/ScrollToTop';
import AdminProducts from './pages/AdminProducts';
import AdminAddProduct from './pages/AdminAddProduct';
import AdminCategories from './pages/AdminCategories';
import AdminProductVariants from './pages/AdminProductVariants';
import AdminProductEdit from './pages/AdminProductEdit';
import AdminLayout from './components/AdminLayout';
import AdminVouchers from './pages/AdminVouchers';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminOrders from './pages/AdminOrders';
import AdminCustomers from './pages/AdminCustomers';
import AdminReports from './pages/AdminReports';

// Hàm bảo vệ Route Admin
function AdminRoute({ children }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/auth" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
    alert('Bạn không có quyền truy cập trang quản trị!');
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  const isAuthOrAdmin = location.pathname === '/auth' || location.pathname.startsWith('/admin');

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      let response = await originalFetch(...args);

      if (response.status === 401 && !args[0].includes('/auth/refresh')) {
        const refreshRes = await originalFetch('/api/v1/auth/refresh', {
          method: 'POST'
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.accessToken || data.data?.accessToken;

          if (newToken) {
            localStorage.setItem('token', newToken);

            const originalOptions = args[1] || {};
            originalOptions.headers = {
              ...originalOptions.headers,
              'Authorization': `Bearer ${newToken}`
            };

            return originalFetch(args[0], originalOptions);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
        }
      }

      return response;
    };
  }, []);

  return (
    <div className="bg-background min-h-screen flex flex-col font-body antialiased">
      {!isAuthOrAdmin && <Header />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Dùng thẻ AdminLayout đã được import từ file bên ngoài */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/add" element={<AdminAddProduct />} />
            <Route path="products/variants/:id" element={<AdminProductVariants />} />
            <Route path="products/edit/:id" element={<AdminProductEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="invoices" element={<div>Quản lý hóa đơn</div>} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
            <Route path="vouchers" element={<AdminVouchers />} />
          </Route>
        </Routes>
      </main>

      {!isAuthOrAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}
