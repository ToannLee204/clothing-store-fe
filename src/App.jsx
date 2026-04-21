import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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

  return (
    <div className="bg-background min-h-screen flex flex-col font-body antialiased">
      {!isAuthOrAdmin && <Header />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Dùng thẻ AdminLayout đã được import từ file bên ngoài */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/add" element={<AdminAddProduct />} />
            <Route path="products/variants/:id" element={<AdminProductVariants />} />
            <Route path="products/edit/:id" element={<AdminProductEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<div>Quản lý đơn hàng</div>} />
            <Route path="customers" element={<div>Quản lý khách hàng</div>} />
            <Route path="invoices" element={<div>Quản lý hóa đơn</div>} />
            <Route path="reports" element={<div>Báo cáo & Thống kê</div>} />
            <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
            <Route path="vouchers" element={<div>Quản lý Voucher</div>} />
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