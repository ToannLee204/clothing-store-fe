import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrdersPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/profile', { state: { activeTab: 'orders' } });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-lumiere-cream flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-lumiere-terracotta border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
