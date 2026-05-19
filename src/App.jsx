import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';
import ScrollToTop from './components/layout/ScrollToTop';

// User pages
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentResultPage from './pages/PaymentResultPage';

// Admin pages
import AdminProducts from './pages/admin/AdminProducts';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProductVariants from './pages/admin/AdminProductVariants';
import AdminProductEdit from './pages/admin/AdminProductEdit';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminReports from './pages/admin/AdminReports';
import AdminChangePassword from './pages/admin/AdminChangePassword';
import AdminProfile from './pages/admin/AdminProfile';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminProductDetail from './pages/admin/AdminProductDetail';

// Hàm bảo vệ Route Admin
function AdminRoute({ children }) {
  const [showModal, setShowModal] = useState(false);
  const userStr = localStorage.getItem('user');
  useEffect(() => {
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        setShowModal(true);
        // Tự động đóng modal sau 3 giây rồi chuyển trang
        setTimeout(() => setShowModal(false), 3000);
      }
    }
  }, [userStr]);
  if (!userStr) return <Navigate to="/auth" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
    return (
      <>
        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white p-8 max-w-sm w-full rounded-2xl shadow-2xl text-center">
              <h3 className="serif text-lg text-lumiere-charcoal mb-4">Thông báo</h3>
              <p className="text-[13px] text-lumiere-gray mb-6">Bạn không có quyền truy cập trang quản trị!</p>
            </div>
          </div>
        )}
        <Navigate to="/" replace />
      </>
    );
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
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminReports />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/add" element={<AdminAddProduct />} />
            <Route path="products/detail/:id" element={<AdminProductDetail />} />
            <Route path="products/variants/:id" element={<AdminProductVariants />} />
            <Route path="products/edit/:id" element={<AdminProductEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="change-password" element={<AdminChangePassword />} />
            <Route path="profile" element={<AdminProfile />} />
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
