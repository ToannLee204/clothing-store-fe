import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import PasswordForm from '../components/profile/PasswordForm';
import MyOrders from '../components/profile/MyOrders';
import ProductReviews from '../components/profile/ProductReviews';
import AddressSection from '../components/profile/AddressSection';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'personal-info');
  const token = localStorage.getItem('token');

  const loadUser = () => {
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/auth');
    } else {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        navigate('/auth');
      }
    }
  };

  useEffect(() => {
    loadUser();
    
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-lumiere-cream pb-24 pt-32">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          <ProfileSidebar 
            user={user} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            onLogout={handleLogout} 
          />

          <main className="flex-1 w-full min-h-[500px]">
            <div className="animate-fade-in h-full">
              {activeTab === 'personal-info' && <PersonalInfoForm user={user} token={token} />}
              {activeTab === 'addresses' && <AddressSection user={user} token={token} />}
              {activeTab === 'reviews' && <ProductReviews token={token} />}
              {activeTab === 'orders' && <MyOrders token={token} />}
              {activeTab === 'password' && <PasswordForm token={token} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}