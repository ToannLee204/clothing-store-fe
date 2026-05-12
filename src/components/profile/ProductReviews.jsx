import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReviewModal from './ReviewModal';
import ViewReviewModal from './ViewReviewModal';
import { authHeaders, extractMessage, parseResponseBody } from '../../api/http';
import { getImageUrl } from '../../utils/format';

const REVIEWS_PAGE_SIZE = 20;

const formatVND = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}\u20ab`;

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function normalizePagination(payload) {
  const base = payload && typeof payload === 'object' && ('meta' in payload || 'result' in payload || 'content' in payload)
    ? payload
    : payload?.data ?? payload;

  return {
    meta: base?.meta ?? base?.data?.meta ?? null,
    result: normalizeList(base),
  };
}

function resolveProductId(item) {
  if (!item || typeof item !== 'object') return '';

  const candidate = item.productId
    ?? item.product?.id
    ?? item.product?.productId
    ?? item.variant?.productId
    ?? item.orderDetail?.productId;

  return candidate != null ? String(candidate) : '';
}

export default function ProductReviews({ token }) {
  const [loading, setLoading] = useState(true);
  const [pendingItems, setPendingItems] = useState([]);
  const [reviewedOrderItems, setReviewedOrderItems] = useState([]);
  const [myReviewList, setMyReviewList] = useState([]);
  const [productMetaById, setProductMetaById] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('pending');

  const [selectedItem, setSelectedItem] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchAllMyReviews = async () => {
    const firstRes = await fetch(`/api/v1/reviews/me?page=0&pageSize=${REVIEWS_PAGE_SIZE}`, {
      headers: authHeaders(),
    });
    const firstPayload = await parseResponseBody(firstRes);

    if (!firstRes.ok) {
      throw new Error(extractMessage(firstPayload, 'Khong the tai danh sach danh gia cua ban.'));
    }

    const firstPage = normalizePagination(firstPayload);
    const totalPages = Math.max(1, Number(firstPage.meta?.pages ?? firstPage.meta?.totalPages ?? 1) || 1);

    if (totalPages === 1) {
      return firstPage.result;
    }

    const pagePromises = Array.from({ length: totalPages - 1 }, (_, idx) =>
      fetch(`/api/v1/reviews/me?page=${idx + 1}&pageSize=${REVIEWS_PAGE_SIZE}`, {
        headers: authHeaders(),
      }).then(async (res) => {
        const payload = await parseResponseBody(res);
        if (!res.ok) {
          throw new Error(extractMessage(payload, 'Khong the tai danh sach danh gia cua ban.'));
        }
        return normalizePagination(payload).result;
      })
    );

    const nextPages = await Promise.all(pagePromises);
    return [firstPage.result, ...nextPages].flat();
  };

  const fetchProductMetaMap = async (reviewsList, allItems) => {
    const productIds = [...new Set(
      reviewsList
        .filter((review) => {
          if (!review?.productId) return false;
          const matchedItem = allItems.find((item) => String(item.orderItemId) === String(review.orderItemId));
          return !matchedItem?.thumbnailUrl;
        })
        .map((review) => review.productId)
    )];

    if (productIds.length === 0) {
      return {};
    }

    const entries = await Promise.all(
      productIds.map(async (productId) => {
        try {
          const res = await fetch(`/api/v1/products/${productId}`, {
            headers: authHeaders(),
          });
          const payload = await parseResponseBody(res);
          if (!res.ok) {
            return [String(productId), null];
          }

          const product = payload?.data ?? payload ?? null;
          return [
            String(productId),
            product
              ? {
                  productName: product.name || product.productName || `San pham #${productId}`,
                  thumbnailUrl: product.thumbnailUrl || product.imageUrl || product.anhDaiDien || product.imageUrls?.[0] || '',
                }
              : null,
          ];
        } catch {
          return [String(productId), null];
        }
      })
    );

    return Object.fromEntries(entries.filter(([, value]) => Boolean(value)));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const pendingRes = await fetch('/api/v1/reviews/me/pending', {
        headers: authHeaders(),
      });
      const pendingPayload = await parseResponseBody(pendingRes);

      if (pendingRes.ok) {
        const pendingList = normalizeList(pendingPayload).map((item) => ({
          ...item,
          orderItemId: item.orderItemId || item.id,
          orderId: item.orderId,
          orderCode: item.orderCode,
          productId: resolveProductId(item),
          productName: item.productName,
          color: item.color,
          size: item.size,
          thumbnailUrl: item.thumbnailUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          completedAt: item.completedAt,
        }));
        setPendingItems(pendingList);
      } else {
        console.error('Fetch pending reviews error:', extractMessage(pendingPayload, 'Khong the tai danh sach san pham chua danh gia.'));
        setPendingItems([]);
      }

      const [ordersResult, reviewsResult] = await Promise.allSettled([
        fetch('/api/v1/orders', {
          headers: authHeaders(),
        }).then(async (ordersRes) => {
          const ordersPayload = await parseResponseBody(ordersRes);
          if (!ordersRes.ok) {
            throw new Error(extractMessage(ordersPayload, 'Khong the tai danh sach don hang.'));
          }

          let orders = [];
          if (Array.isArray(ordersPayload)) orders = ordersPayload;
          else if (Array.isArray(ordersPayload?.result)) orders = ordersPayload.result;
          else if (Array.isArray(ordersPayload?.content)) orders = ordersPayload.content;
          else if (Array.isArray(ordersPayload?.data?.result)) orders = ordersPayload.data.result;
          else if (Array.isArray(ordersPayload?.data?.content)) orders = ordersPayload.data.content;

          const allItems = [];
          orders.forEach((order) => {
            const orderId = order.orderId || order.id;
            const status = (order.status || '').toLowerCase();
            const itemsList = order.items || order.orderItems || order.orderDetails || order.details || [];

            itemsList.forEach((item) => {
              allItems.push({
                ...item,
                orderItemId: item.orderItemId || item.id,
                productId: resolveProductId(item),
                orderId,
                orderCode: order.orderCode,
                orderStatus: status,
              });
            });
          });

          return allItems;
        }),
        fetchAllMyReviews(),
      ]);

      const allItems = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
      const reviewsList = reviewsResult.status === 'fulfilled' ? reviewsResult.value : [];

      if (ordersResult.status === 'rejected') {
        console.error('Fetch orders error:', ordersResult.reason);
      }
      if (reviewsResult.status === 'rejected') {
        console.error('Fetch my reviews error:', reviewsResult.reason);
      }

      const productMetaMap = await fetchProductMetaMap(reviewsList, allItems);
      setReviewedOrderItems(allItems);
      setMyReviewList(reviewsList);
      setProductMetaById(productMetaMap);
    } catch (err) {
      console.error('Fetch reviews error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reviewedItems = myReviewList
    .map((review) => {
      const matchedItem = reviewedOrderItems.find((item) => String(item.orderItemId) === String(review.orderItemId));
      const productMeta = productMetaById[String(review.productId)] || null;

      return {
        ...(matchedItem || {}),
        orderItemId: review.orderItemId,
        productId: resolveProductId(matchedItem) || resolveProductId(review),
        orderCode: matchedItem?.orderCode || `Order item #${review.orderItemId}`,
        productName: matchedItem?.productName || productMeta?.productName || `San pham #${review.productId ?? review.orderItemId}`,
        color: matchedItem?.color || '--',
        size: matchedItem?.size || '--',
        unitPrice: matchedItem?.unitPrice || 0,
        thumbnailUrl: matchedItem?.thumbnailUrl || productMeta?.thumbnailUrl || '',
        review,
      };
    })
    .sort((a, b) => new Date(b.review?.createdAt || 0) - new Date(a.review?.createdAt || 0));

  const handleOpenReview = (item) => {
    setSelectedItem(item);
    setShowReviewModal(true);
  };

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  return (
    <div className="bg-white border border-lumiere-gray/15 p-8 lg:p-12 animate-fade-in">
      <header className="mb-10">
        <h2 className="serif text-3xl text-lumiere-charcoal mb-2">Danh gia san pham</h2>
        <p className="text-[13px] text-lumiere-gray">Chia se cam nhan cua ban ve cac san pham da mua.</p>
      </header>

      <div className="flex border-b border-lumiere-gray/10 mb-8">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-6 py-4 text-[12px] tracking-[0.2em] uppercase font-bold transition-all border-b-2 ${
            activeSubTab === 'pending' ? 'border-lumiere-terracotta text-lumiere-charcoal' : 'border-transparent text-lumiere-gray hover:text-lumiere-charcoal'
          }`}
        >
          Chua danh gia ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`px-6 py-4 text-[12px] tracking-[0.2em] uppercase font-bold transition-all border-b-2 ${
            activeSubTab === 'completed' ? 'border-lumiere-terracotta text-lumiere-charcoal' : 'border-transparent text-lumiere-gray hover:text-lumiere-charcoal'
          }`}
        >
          Da danh gia ({reviewedItems.length})
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
              <p className="serif text-xl text-lumiere-gray italic">Khong co san pham nao.</p>
            </div>
          ) : (
            (activeSubTab === 'pending' ? pendingItems : reviewedItems).map((item, idx) => (
              <div key={idx} className="bg-lumiere-cream/20 border border-lumiere-gray/10 p-6 flex flex-col md:flex-row gap-6 hover:border-lumiere-gray/30 transition-all">
                <div 
                  onClick={() => {
                    const pid = item.productId;
                    if (pid) window.open(`/product/${pid}`, '_blank');
                  }}
                  className="w-20 h-28 bg-lumiere-blush shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {item.thumbnailUrl && <img src={getImageUrl(item.thumbnailUrl)} alt={item.productName} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <p className="text-[11px] tracking-widest text-lumiere-gray uppercase mb-1">Don hang: {item.orderCode}</p>
                    <h4 className="text-lg truncate">
                      <Link
                        to={`/product/${item.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-lumiere-charcoal hover:text-lumiere-terracotta transition-colors"
                      >
                      {item.productName}
                      </Link>
                    </h4>
                    <p className="text-[12px] text-lumiere-gray mt-1">Mau: {item.color} / Size: {item.size}</p>
                    {activeSubTab === 'pending' ? (
                      <p className="text-[12px] text-lumiere-gray mt-1">
                        So luong: {item.quantity || 0} • Tam tinh: {formatVND(item.lineTotal ?? item.unitPrice ?? 0)}
                      </p>
                    ) : null}
                  </div>

                  {activeSubTab === 'completed' && item.review && (
                    <div className="mb-4 p-3 bg-white/50 border border-lumiere-gray/5 rounded">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`material-symbols-outlined text-[16px] ${star <= item.review.starRating ? 'text-lumiere-terracotta' : 'text-lumiere-gray/20'}`}
                              style={{ fontVariationSettings: star <= item.review.starRating ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-lumiere-gray uppercase tracking-tighter">
                          {new Date(item.review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-[12px] text-lumiere-gray italic line-clamp-1">"{item.review.content}"</p>
                      {item.review.likeCount > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-lumiere-terracotta">
                          <span className="material-symbols-outlined text-[14px]">favorite</span>
                          <span>{item.review.likeCount} nguoi thich</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-end">
                    <div className="text-[14px] font-bold text-lumiere-charcoal">
                      {activeSubTab === 'pending'
                        ? formatVND(item.lineTotal ?? item.unitPrice ?? 0)
                        : ''}
                    </div>
                    {activeSubTab === 'pending' ? (
                      <button
                        onClick={() => handleOpenReview(item)}
                        className="bg-lumiere-charcoal text-white text-[11px] tracking-[0.2em] uppercase font-medium px-6 py-2.5 hover:bg-lumiere-terracotta transition-all shadow-lg shadow-lumiere-charcoal/10"
                      >
                        Viet danh gia
                      </button>
                    ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenReview(item)}
                        className="bg-lumiere-cream border border-lumiere-charcoal text-lumiere-charcoal text-[11px] tracking-[0.2em] uppercase font-medium px-4 py-2.5 hover:bg-lumiere-charcoal hover:text-white transition-all"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleOpenView(item)}
                        className="border border-lumiere-charcoal text-lumiere-charcoal text-[11px] tracking-[0.2em] uppercase font-medium px-4 py-2.5 hover:bg-lumiere-charcoal hover:text-white transition-all"
                      >
                        Xem chi tiết
                      </button>
                    </div>
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
