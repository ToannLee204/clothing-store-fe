import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer'; 
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import ScrollToTop from './components/ScrollToTop';

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

function AdminLayout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return (
    <div className="bg-surface min-h-screen">
      <AdminSidebar />
      <AdminHeader user={user} />
      <main className="ml-72 pt-32 pb-20 px-10 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
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

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<div>Quản lý sản phẩm</div>} />
            <Route path="orders" element={<div>Quản lý đơn hàng</div>} />
            <Route path="customers" element={<div>Quản lý khách hàng</div>} />
            <Route path="invoices" element={<div>Quản lý hóa đơn</div>} />
            <Route path="reports" element={<div>Báo cáo & Thống kê</div>} />
            <Route path="settings" element={<div>Cài đặt hệ thống</div>} />
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