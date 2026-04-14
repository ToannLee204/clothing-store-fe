import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer'; 
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';

function AppContent() {
  const location = useLocation();
  
  // Kiểm tra: Nếu đang ở trang Đăng nhập/Đăng ký (/auth) thì ẩn Header & Footer
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="bg-background min-h-screen flex flex-col font-body antialiased">
      {!isAuthPage && <Header />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
