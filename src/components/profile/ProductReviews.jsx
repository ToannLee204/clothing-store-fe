import React, { useEffect, useState } from 'react';
import ReviewModal from './ReviewModal';
import ViewReviewModal from './ViewReviewModal';

const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}₫`;

export default function ProductReviews({ token }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [myReviews, setMyReviews] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending' or 'completed'
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersRes = await fetch('/api/v1/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersPayload = await ordersRes.json();
      const orders = ordersPayload.result || ordersPayload.data?.result || ordersPayload.content || [];
      const completedOrders = orders.filter(o => o.status === 'completed');
      
      const allItems = [];
      completedOrders.forEach(order => {
        (order.items || []).forEach(item => {
          allItems.push({ ...item, orderId: order.id, orderCode: order.orderCode });
        });
      });

      const reviewsRes = await fetch('/api/v1/reviews/me?page=0&pageSize=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reviewsPayload = await reviewsRes.json();
      const reviewsList = reviewsPayload.result || reviewsPayload.data?.result || [];
      const reviewsMap = {};
      reviewsList.forEach(r => {
        if (r.orderItemId) reviewsMap[String(r.orderItemId)] = r;
      });

      setItems(allItems);
      setMyReviews(reviewsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingItems = items.filter(item => !myReviews[String(item.orderItemId)]);
  const reviewedItems = items.filter(item => myReviews[String(item.orderItemId)]);

  const handleOpenReview = (item) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  const handleOpenView = (item) => {
    setSelectedItem({ ...item, review: myReviews[String(item.orderItemId)] });
    setShowViewModal(true);
  };

  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12 animate-fade-in">
      <header className="mb-10">
        <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Đánh giá sản phẩm</h2>
        <p className="text-[13px] text-lumiere-gray">Chia sẻ cảm nhận của bạn về các sản phẩm đã mua.</p>
      </header>

      <div className="flex border-b border-lumiere-gray/10 mb-8">
        <button 
          onClick={() => setActiveSubTab('pending')}
          className={`px-6 py-4 text-[12px] tracking-[0.2em] uppercase font-bold transition-all border-b-2 ${
            activeSubTab === 'pending' ? 'border-lumiere-terracotta text-lumiere-charcoal' : 'border-transparent text-lumiere-gray hover:text-lumiere-charcoal'
          }`}
        >
          Chưa đánh giá ({pendingItems.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('completed')}
          className={`px-6 py-4 text-[12px] tracking-[0.2em] uppercase font-bold transition-all border-b-2 ${
            activeSubTab === 'completed' ? 'border-lumiere-terracotta text-lumiere-charcoal' : 'border-transparent text-lumiere-gray hover:text-lumiere-charcoal'
          }`}
        >
          Đã đánh giá ({reviewedItems.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-2 border-lumiere-terracotta border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeSubTab === 'pending' ? pendingItems : reviewedItems).length === 0 ? (
            <div className="py-16 text-center border border-dashed border-lumiere-gray/20">
              <p className="serif text-xl text-lumiere-gray italic">Không có sản phẩm nào.</p>
            </div>
          ) : (
            (activeSubTab === 'pending' ? pendingItems : reviewedItems).map((item, idx) => (
              <div key={idx} className="bg-lumiere-cream/20 border border-lumiere-gray/10 p-6 flex flex-col md:flex-row gap-6 hover:border-lumiere-gray/30 transition-all">
                <div className="w-20 h-28 bg-lumiere-blush shrink-0 overflow-hidden">
                  {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <p className="text-[11px] tracking-widest text-lumiere-gray uppercase mb-1">Đơn hàng: {item.orderCode}</p>
                    <h4 className="font-semibold text-lumiere-charcoal text-lg truncate">{item.productName}</h4>
                    <p className="text-[12px] text-lumiere-gray mt-1">Màu: {item.color} / Size: {item.size}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[14px] font-bold text-lumiere-charcoal">{formatVND(item.unitPrice)}</p>
                    {activeSubTab === 'pending' ? (
                      <button 
                        onClick={() => handleOpenReview(item)}
                        className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium px-6 py-2.5 hover:bg-lumiere-terracotta transition-all shadow-lg shadow-lumiere-charcoal/10"
                      >
                        Viết đánh giá
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleOpenView(item)}
                        className="border border-lumiere-charcoal text-lumiere-charcoal text-[11px] tracking-[0.2em] uppercase font-medium px-6 py-2.5 hover:bg-lumiere-charcoal hover:text-white transition-all"
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ReviewModal 
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        item={selectedItem}
        token={token}
        onSuccess={fetchData}
      />

      <ViewReviewModal 
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        item={selectedItem}
      />
    </div>
  );
}
