import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_ORDERS_URL = "/api/v1/orders";
const API_REVIEWS_URL = "/api/v1/reviews";
const API_INVOICES_URL = "/api/v1/invoices";

const parseJson = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const extractMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.data?.message === "string") return payload.data.message;
  return fallback;
};

function formatVND(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)}₫`;
}

function StarRow({ value, size = 16 }) {
  const starValue = Math.max(0, Math.min(5, Number(value) || 0));
  const fullStars = Math.round(starValue * 2) / 2; // allow halves if any
  const stars = Array.from({ length: 5 }).map((_, idx) => {
    const starIndex = idx + 1;
    const filled = fullStars >= starIndex;
    const half = fullStars >= starIndex - 0.5 && fullStars < starIndex;
    const color = filled || half ? "#ec5b13" : "#cbd5e1";

    if (half) {
      return (
        <span key={idx} className="relative inline-block" style={{ width: size, height: size }}>
          <span className="absolute inset-0">
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity="0.35">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
          <span className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
        </span>
      );
    }

    return (
      <span key={idx} style={{ color }} className="inline-flex">
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </span>
    );
  });

  return <div className="flex items-center gap-1">{stars}</div>;
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReviewByOrderItemId, setMyReviewByOrderItemId] = useState({});

  const [reviewDraftOrderItemId, setReviewDraftOrderItemId] = useState(null);
  const [draftStar, setDraftStar] = useState(5);
  const [draftContent, setDraftContent] = useState("");
  const [draftImages, setDraftImages] = useState([]);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  // Edit/Delete review (customer)
  const [editReviewId, setEditReviewId] = useState(null);
  const [editBusy, setEditBusy] = useState(false);

  const [editDraftStar, setEditDraftStar] = useState(5);
  const [editDraftContent, setEditDraftContent] = useState("");
  const [editReviewError, setEditReviewError] = useState("");
  const [editReviewSuccess, setEditReviewSuccess] = useState("");

  const canRetryVnpay = (o) =>
    o?.status === "payment_failed" || (o?.status === "payment_failed" && o?.paymentMethod === "vnpay");

  const isInvoicePaid = Boolean(
    order?.payment?.status === "paid" ||
      order?.paymentStatus === "paid" ||
      order?.payment?.paidAt ||
      order?.paidAt
  );

  const canDownloadInvoice = Boolean(orderId) && isInvoicePaid;

  const downloadInvoicePdf = async () => {
    if (!token) {
      setInvoiceError("Bạn cần đăng nhập để xuất hóa đơn.");
      return;
    }
    if (!orderId) return;

    setInvoiceBusy(true);
    setInvoiceError("");

    try {
      const res = await fetch(`${API_INVOICES_URL}/order/${orderId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Không thể xuất hóa đơn.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1500);
    } catch (e) {
      setInvoiceError(e?.message || "Không thể xuất hóa đơn.");
    } finally {
      setInvoiceBusy(false);
    }
  };

  const fetchDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_ORDERS_URL}/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, "Không thể tải chi tiết đơn hàng."));
      setOrder(payload?.data ?? payload);
    } catch (e) {
      setError(e?.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    if (!order) return;

    setReviewsLoading(true);
    setReviewError("");

    try {
      const res = await fetch(`${API_REVIEWS_URL}/me?page=0&pageSize=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await parseJson(res);

      if (!res.ok) throw new Error(extractMessage(payload, "Không thể tải đánh giá của bạn."));

      const result = payload?.result ?? payload?.data?.result ?? [];
      const list = Array.isArray(result) ? result : [];

      const map = {};
      for (const r of list) {
        if (r?.orderItemId != null) map[String(r.orderItemId)] = r;
      }
      setMyReviewByOrderItemId(map);
    } catch (e) {
      setReviewError(e?.message || "Không thể tải đánh giá của bạn.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    fetchMyReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderId]);

  useEffect(() => {
    if (!editReviewSuccess) return;
    const t = window.setTimeout(() => setEditReviewSuccess(""), 3000);
    return () => window.clearTimeout(t);
  }, [editReviewSuccess]);

  const total = order?.total ?? 0;

  const orderItems = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order]);

  const openDraftFor = (item) => {
    setReviewDraftOrderItemId(item?.orderItemId ?? null);
    setDraftStar(5);
    setDraftContent("");
    setDraftImages([]);
    setReviewError("");
  };

  const closeDraft = () => {
    setReviewDraftOrderItemId(null);
    setDraftImages([]);
    setReviewError("");
  };

  const submitReview = async (item) => {
    if (!token) {
      setReviewError("Bạn cần đăng nhập để đánh giá.");
      return;
    }

    const orderItemIdValue = item?.orderItemId;
    if (!orderItemIdValue) {
      setReviewError("Thiếu orderItemId.");
      return;
    }

    setReviewBusy(true);
    setReviewError("");

    try {
      const formData = new FormData();
      formData.append("orderItemId", String(orderItemIdValue));
      formData.append("starRating", String(draftStar));
      if (draftContent) formData.append("content", draftContent);

      if (draftImages?.length) {
        for (const file of draftImages) {
          formData.append("images", file);
        }
      }

      const res = await fetch(`${API_REVIEWS_URL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = await parseJson(res);
      if (!res.ok) throw new Error(extractMessage(payload, "Không thể tạo đánh giá."));

      const created = payload?.data ?? payload;
      if (!created?.orderItemId) {
        if (payload?.orderItemId != null) {
          setMyReviewByOrderItemId((prev) => ({ ...prev, [String(payload.orderItemId)]: payload }));
        }
      } else {
        setMyReviewByOrderItemId((prev) => ({ ...prev, [String(created.orderItemId)]: created }));
      }

      closeDraft();
    } catch (e) {
      setReviewError(e?.message || "Không thể tạo đánh giá.");
    } finally {
      setReviewBusy(false);
    }
  };

  const openEditReview = (review) => {
    if (!review?.reviewId) return;
    if (!token) {
      setEditReviewError("Bạn cần đăng nhập để sửa đánh giá.");
      return;
    }

    setEditReviewSuccess("");
    setEditReviewError("");

    setEditReviewId(review.reviewId);
    setEditDraftStar(Number(review.starRating ?? 5));
    setEditDraftContent(review.content ?? "");
  };

  const closeEditReview = () => {
    setEditReviewId(null);
    setEditReviewError("");
  };

  const saveEditReview = async (review) => {
    if (!review?.reviewId) return;

    if (!token) {
      setEditReviewError("Bạn cần đăng nhập để sửa đánh giá.");
      return;
    }
    if (editBusy) return;

    const star = Number(editDraftStar);
    if (!Number.isFinite(star) || star < 1 || star > 5) {
      setEditReviewError("Số sao không hợp lệ (1-5).");
      return;
    }

    setEditBusy(true);
    setEditReviewError("");

    try {
      const formData = new FormData();
      formData.append("starRating", String(star));
      if (editDraftContent !== "") formData.append("content", editDraftContent);

      const res = await fetch(`${API_REVIEWS_URL}/${review.reviewId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Không thể sửa đánh giá.");
      }

      await fetchMyReviews();
      setEditReviewSuccess("Đã sửa đánh giá thành công!");
      closeEditReview();
    } catch (e) {
      setEditReviewError(e?.message || "Không thể sửa đánh giá.");
    } finally {
      setEditBusy(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!reviewId) return;
    if (!token) {
      alert("Bạn cần đăng nhập để xóa đánh giá.");
      return;
    }
    if (editBusy) return;

    const ok = window.confirm("Bạn có chắc muốn xóa đánh giá này không?");
    if (!ok) return;

    setEditBusy(true);
    try {
      const res = await fetch(`${API_REVIEWS_URL}/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Không thể xóa đánh giá.");
      }

      await fetchMyReviews();
      alert("Đã xóa đánh giá thành công!");
    } catch (e) {
      alert(e?.message || "Không thể xóa đánh giá.");
    } finally {
      setEditBusy(false);
    }
  };

  const orderCompleted = order?.status === "completed";

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen pb-24">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-900 truncate">Chi tiết đơn hàng</h1>
            <p className="text-sm text-slate-500 mt-1">
              Mã: <span className="font-bold">{order?.orderCode ?? orderId}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/orders"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              ← Quay lại
            </Link>

            {order?.paymentUrl ? (
              <a
                href={order.paymentUrl}
                className="rounded-xl bg-[#ec5b13] px-4 py-2 text-xs font-black text-white hover:bg-[#d95210]"
              >
                Thanh toán ngay
              </a>
            ) : null}

            {canDownloadInvoice ? (
              <button
                type="button"
                onClick={downloadInvoicePdf}
                disabled={invoiceBusy}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                {invoiceBusy ? "Đang xuất..." : "Xuất hóa đơn"}
              </button>
            ) : null}
          </div>
        </div>

        {invoiceError ? (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-rose-700 font-bold">{invoiceError}</div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-100 p-6">Đang tải...</div>
        ) : error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-700 font-bold">{error}</div>
        ) : !order ? (
          <div className="rounded-2xl bg-white border border-slate-100 p-10 text-center text-slate-500 font-bold">
            Không tìm thấy đơn hàng
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            {/* Left */}
            <section className="rounded-3xl bg-white border border-slate-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                    Trạng thái: <span className="ml-1">{order.status}</span>
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                    Thanh toán: <span className="ml-1">{order.paymentStatus}</span>
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Tổng tiền</div>
                  <div className="text-xl font-black text-slate-900">{formatVND(total)}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-lg font-black text-slate-900 mb-3">Sản phẩm</h2>

                {reviewsLoading ? <div className="mb-4 text-sm text-slate-500">Đang tải đánh giá...</div> : null}

                {reviewError ? (
                  <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-sm font-bold">
                    {reviewError}
                  </div>
                ) : null}

                {editReviewError ? (
                  <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-sm font-bold">
                    {editReviewError}
                  </div>
                ) : null}

                {editReviewSuccess ? (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700 text-sm font-bold">
                    {editReviewSuccess}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {orderItems.map((item) => {
                    const orderItemIdValue = item?.orderItemId;
                    const review = myReviewByOrderItemId[String(orderItemIdValue)] ?? null;

                    return (
                      <div key={String(orderItemIdValue ?? item.variantId)} className="rounded-2xl border border-slate-100 p-3">
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.productName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs text-slate-400">IMG</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 truncate">{item.productName}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Màu: {item.color || "—"} · Size: {item.size || "—"}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-slate-500">SL</div>
                                <div className="font-black text-slate-900">{item.quantity}</div>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="text-xs text-slate-500">Đơn giá</div>
                              <div className="text-sm font-black text-slate-900">{formatVND(item.unitPrice)}</div>
                              <div className="text-xs text-slate-500">Thành tiền</div>
                              <div className="text-sm font-black text-slate-900">{formatVND(item.lineTotal)}</div>
                            </div>

                            <div className="mt-3">
                              {review ? (
                                editReviewId === review.reviewId ? (
                                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                                            Sửa đánh giá
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          {Array.from({ length: 5 }).map((_, idx) => {
                                            const star = idx + 1;
                                            const active = editDraftStar >= star;
                                            return (
                                              <button
                                                key={star}
                                                type="button"
                                                onClick={() => setEditDraftStar(star)}
                                                className={`flex items-center justify-center rounded-xl border px-3 py-2 transition ${
                                                  active
                                                    ? "border-[#ec5b13] bg-[#ec5b13]/10 text-[#c84c10]"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                                disabled={editBusy}
                                              >
                                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                                  star
                                                </span>
                                                <span className="ml-1 text-xs font-black">{star}</span>
                                              </button>
                                            );
                                          })}
                                        </div>

                                        <div className="mt-3">
                                          <label className="text-xs font-bold text-slate-700">Nội dung (tuỳ chọn)</label>
                                          <textarea
                                            value={editDraftContent}
                                            onChange={(e) => setEditDraftContent(e.target.value)}
                                            rows={3}
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10 disabled:opacity-50"
                                            placeholder="Chia sẻ trải nghiệm của bạn..."
                                            disabled={editBusy}
                                          />
                                        </div>

                                        {editReviewError ? (
                                          <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-sm font-bold">
                                            {editReviewError}
                                          </div>
                                        ) : null}

                                        <div className="mt-3 flex gap-2 justify-end">
                                          <button
                                            type="button"
                                            onClick={closeEditReview}
                                            disabled={editBusy}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                          >
                                            Hủy
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => saveEditReview(review)}
                                            disabled={editBusy}
                                            className="rounded-xl bg-[#ec5b13] px-3 py-2 text-xs font-black text-white hover:bg-[#d95210] disabled:opacity-50"
                                          >
                                            {editBusy ? "Đang lưu..." : "Lưu"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
                                            Đã đánh giá
                                          </span>
                                          <StarRow value={review.starRating} />
                                        </div>

                                        {review.content ? (
                                          <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-line">
                                            {review.content}
                                          </p>
                                        ) : null}

                                        {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 ? (
                                          <div className="mt-3 flex flex-wrap gap-2">
                                            {review.imageUrls.slice(0, 5).map((url, idx) => (
                                              <div key={String(url ?? idx)} className="h-16 w-16 rounded-xl border border-slate-200 bg-white overflow-hidden">
                                                <img
                                                  src={url}
                                                  alt={`Review image ${idx + 1}`}
                                                  className="h-full w-full object-cover"
                                                  onError={(e) => {
                                                    e.currentTarget.src = "https://placehold.co/64x64?text=IMG";
                                                  }}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        ) : null}

                                        <div className="mt-2 text-xs text-slate-500">
                                          {review.createdAt ? `Gửi lúc ${new Date(review.createdAt).toLocaleString("vi-VN")}` : ""}
                                        </div>
                                      </div>

                                      <div className="text-right space-y-2">
                                        <div className="flex items-center justify-end gap-2">
                                          <div className="text-xs font-bold text-slate-600">♥</div>
                                          <div className="text-sm font-black text-slate-900">{review.likeCount ?? 0}</div>
                                        </div>

                                        <div className="flex flex-wrap justify-end gap-2">
                                          <button
                                            type="button"
                                            disabled={editBusy}
                                            onClick={() => openEditReview(review)}
                                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                          >
                                            Sửa
                                          </button>

                                          <button
                                            type="button"
                                            disabled={editBusy}
                                            onClick={() => deleteReview(review.reviewId)}
                                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                          >
                                            Xóa
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div>
                                  {orderCompleted ? (
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openDraftFor(item)}
                                          className="rounded-xl border border-[#ec5b13]/30 bg-[#ec5b13]/5 px-3 py-2 text-xs font-black text-[#c84c10] hover:bg-[#ec5b13]/10 transition"
                                        >
                                          Đánh giá sản phẩm
                                        </button>
                                      </div>

                                      {reviewDraftOrderItemId === orderItemIdValue ? (
                                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="font-black text-slate-900 text-sm">Chọn số sao</div>
                                            <div className="text-xs text-slate-500">1 - 5</div>
                                          </div>

                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {Array.from({ length: 5 }).map((_, idx) => {
                                              const star = idx + 1;
                                              const active = draftStar >= star;
                                              return (
                                                <button
                                                  key={star}
                                                  type="button"
                                                  onClick={() => setDraftStar(star)}
                                                  className={`flex items-center justify-center rounded-xl border px-3 py-2 transition ${
                                                    active
                                                      ? "border-[#ec5b13] bg-[#ec5b13]/10 text-[#c84c10]"
                                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                  }`}
                                                >
                                                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                                    star
                                                  </span>
                                                  <span className="ml-1 text-xs font-black">{star}</span>
                                                </button>
                                              );
                                            })}
                                          </div>

                                          <div className="mt-3">
                                            <label className="text-xs font-bold text-slate-700">Nội dung (tuỳ chọn)</label>
                                            <textarea
                                              value={draftContent}
                                              onChange={(e) => setDraftContent(e.target.value)}
                                              rows={3}
                                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#ec5b13] focus:ring-4 focus:ring-[#ec5b13]/10"
                                              placeholder="Chia sẻ trải nghiệm của bạn..."
                                            />
                                          </div>

                                          <div className="mt-3">
                                            <label className="text-xs font-bold text-slate-700">Ảnh (tối đa 5)</label>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              onChange={(e) => setDraftImages(Array.from(e.target.files || []).slice(0, 5))}
                                              className="mt-1 w-full text-sm"
                                            />
                                            {draftImages.length > 0 ? (
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {draftImages.slice(0, 5).map((file, idx) => (
                                                  <div key={String(idx)} className="h-16 w-16 rounded-xl border border-slate-200 bg-white overflow-hidden">
                                                    <img
                                                      alt={`draft ${idx + 1}`}
                                                      src={URL.createObjectURL(file)}
                                                      className="h-full w-full object-cover"
                                                      onLoad={(e) => {
                                                        URL.revokeObjectURL(e.currentTarget.src);
                                                      }}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            ) : null}
                                          </div>

                                          {reviewError ? (
                                            <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-sm font-bold">
                                              {reviewError}
                                            </div>
                                          ) : null}

                                          <div className="mt-3 flex gap-2 justify-end">
                                            <button
                                              type="button"
                                              onClick={closeDraft}
                                              disabled={reviewBusy}
                                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                              Hủy
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => submitReview(item)}
                                              disabled={reviewBusy || draftStar < 1 || draftStar > 5}
                                              className="rounded-xl bg-[#ec5b13] px-3 py-2 text-xs font-black text-white hover:bg-[#d95210] disabled:opacity-50"
                                            >
                                              {reviewBusy ? "Đang gửi..." : "Gửi đánh giá"}
                                            </button>
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-slate-500">Chỉ có thể đánh giá khi đơn đã hoàn tất.</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {orderItems.length === 0 ? <div className="text-sm text-slate-500">Không có dữ liệu sản phẩm</div> : null}
                </div>
              </div>
            </section>

            {/* Right */}
            <aside className="rounded-3xl bg-white border border-slate-100 p-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">Thông tin nhận hàng</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Người nhận</div>
                  <div className="font-black text-slate-900">{order.recipientName || "—"}</div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">SĐT</div>
                  <div className="font-black text-slate-900">{order.recipientPhone || "—"}</div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa chỉ</div>
                  <div className="font-semibold text-slate-900">{order.addressLine || "—"}</div>
                </div>

                {order.voucherCode ? (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Voucher</div>
                    <div className="font-semibold text-slate-900">{order.voucherCode}</div>
                  </div>
                ) : null}

                {order.note ? (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ghi chú</div>
                    <div className="font-semibold text-slate-900">{order.note}</div>
                  </div>
                ) : null}

                {order.trackingCode ? (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tracking code</div>
                    <div className="font-semibold text-slate-900">{order.trackingCode}</div>
                  </div>
                ) : null}

                {order.cancelReason ? (
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lý do hủy</div>
                    <div className="font-semibold text-slate-900">{order.cancelReason}</div>
                  </div>
                ) : null}
              </div>

              {order.payment ? (
                <div className="border-t border-slate-100 mt-6 pt-6">
                  <h3 className="text-md font-black text-slate-900 mb-3">Thanh toán</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phương thức</span>
                      <span className="font-black text-slate-900">{order.payment.method}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Trạng thái</span>
                      <span className="font-black text-slate-900">{order.payment.status}</span>
                    </div>
                    {order.payment.vnpayTransactionNo ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">VNPAY TXN</span>
                        <span className="font-black text-slate-900">{order.payment.vnpayTransactionNo}</span>
                      </div>
                    ) : null}
                    {order.payment.paidAt ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Paid at</span>
                        <span className="font-black text-slate-900">{new Date(order.payment.paidAt).toLocaleString("vi-VN")}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
