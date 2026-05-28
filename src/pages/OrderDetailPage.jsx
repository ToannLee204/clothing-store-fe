import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getImageUrl, formatVND, formatDateTime } from "../utils/format";

const API_ORDERS_URL = "/api/v1/orders";
const API_REVIEWS_URL = "/api/v1/reviews";
const API_INVOICES_URL = "/api/v1/invoices";

function parseJson(res) {
  return res.text().then((text) => {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  });
}

function extractMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.data?.message === "string") return payload.data.message;
  return fallback;
}

function resolveProductId(item) {
  if (!item || typeof item !== "object") return "";

  const candidate =
    item.productId ??
    item.product?.id ??
    item.product?.productId ??
    item.variant?.productId ??
    item.orderDetail?.productId;

  return candidate != null ? String(candidate) : "";
}

function normalizeOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function getOrderTotal(order) {
  return order?.total ?? order?.totalAmount ?? order?.subTotal ?? 0;
}

function getPaymentMethod(order) {
  return order?.payment?.method ?? order?.paymentMethod ?? "—";
}

function getPaymentStatus(order) {
  return order?.payment?.status ?? order?.paymentStatus ?? "";
}

function isInvoicePaid(order) {
  return Boolean(
    getPaymentStatus(order)?.toLowerCase() === "paid" ||
      order?.payment?.paidAt ||
      order?.paidAt
  );
}

function isOrderCompleted(order) {
  return (order?.status || "").toLowerCase() === "completed";
}

function isRefundRelated(status) {
  const statusKey = (status || "").toLowerCase();
  return [
    "refund_requested",
    "return_requested",
    "return_approved",
    "returning",
    "return_confirmed",
    "returned",
    "refunded",
    "rejected_refund",
    "rejected_return",
    "recjected_refund",
  ].includes(statusKey);
}

function getOrderStatusMeta(status) {
  const statusKey = (status || "").toLowerCase();

  switch (statusKey) {
    case "pending":
      return { label: "Chờ xác nhận", tone: "amber" };
    case "confirmed":
      return { label: "Đã xác nhận", tone: "blue" };
    case "shipping":
      return { label: "Đang giao hàng", tone: "indigo" };
    case "completed":
      return { label: "Đã hoàn tất", tone: "emerald" };
    case "cancelled":
      return { label: "Đã hủy", tone: "rose" };
    case "payment_failed":
      return { label: "Thanh toán thất bại", tone: "rose" };
    case "refund_requested":
    case "return_requested":
      return { label: "Đang yêu cầu trả hàng", tone: "amber" };
    case "return_approved":
      return { label: "Đã chấp nhận trả hàng", tone: "blue" };
    case "returning":
      return { label: "Đang hoàn hàng", tone: "indigo" };
    case "return_confirmed":
      return { label: "Đã nhận hàng hoàn", tone: "indigo" };
    case "returned":
      return { label: "Đã hoàn hàng", tone: "emerald" };
    case "rejected_refund":
    case "rejected_return":
    case "recjected_refund":
      return { label: "Từ chối trả hàng", tone: "rose" };
    case "refunded":
      return { label: "Đã hoàn tiền", tone: "indigo" };
    default:
      return { label: status || "—", tone: "slate" };
  }
}

function getPaymentStatusMeta(status) {
  const statusKey = (status || "").toLowerCase();

  switch (statusKey) {
    case "unpaid":
      return { label: "Chưa thanh toán", tone: "amber" };
    case "pending":
      return { label: "Chờ thanh toán", tone: "blue" };
    case "success":
      return { label: "Đã thanh toán", tone: "emerald" };
    case "failed":
      return { label: "Thanh toán thất bại", tone: "rose" };
    case "refund_requested":
    case "return_requested":
      return { label: "Đang yêu cầu hoàn tiền", tone: "amber" };
    case "rejected_refund":
    case "rejected_return":
    case "recjected_refund":
      return { label: "Từ chối hoàn tiền", tone: "rose" };
    case "refunded":
      return { label: "Đã hoàn tiền", tone: "indigo" };
    default:
      return { label: status || "—", tone: "slate" };
  }
}

function ReviewStars({ value }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => {
        const active = idx < rating;
        return (
          <span
            key={idx}
            className={`material-symbols-outlined text-[18px] ${active ? "text-amber-500" : "text-slate-300"}`}
            aria-hidden="true"
          >
            star
          </span>
        );
      })}
    </div>
  );
}

function StatusPill({ label, tone = "slate" }) {
  const toneClass = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${toneClass}`}>
      {label}
    </span>
  );
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
  const [draftImagePreviews, setDraftImagePreviews] = useState([]);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const [editReviewId, setEditReviewId] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editDraftStar, setEditDraftStar] = useState(5);
  const [editDraftContent, setEditDraftContent] = useState("");
  const [editReviewError, setEditReviewError] = useState("");
  const [editReviewSuccess, setEditReviewSuccess] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });

  const orderItems = useMemo(() => normalizeOrderItems(order), [order]);
  const orderTotal = useMemo(() => getOrderTotal(order), [order]);
  const paymentStatus = useMemo(() => getPaymentStatus(order), [order]);
  const paymentMethod = useMemo(() => getPaymentMethod(order), [order]);
  const orderCompleted = useMemo(() => isOrderCompleted(order), [order]);
  const orderRefundRelated = useMemo(() => isRefundRelated(order?.status), [order]);

  useEffect(() => {
    return () => {
      draftImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [draftImagePreviews]);

  useEffect(() => {
    const previews = draftImages.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      url: URL.createObjectURL(file),
    }));

    setDraftImagePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [draftImages]);

  useEffect(() => {
    if (!editReviewSuccess) return;

    const timer = window.setTimeout(() => setEditReviewSuccess(""), 3000);
    return () => window.clearTimeout(timer);
  }, [editReviewSuccess]);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    fetchMyReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderId]);

  async function fetchDetail() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_ORDERS_URL}/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = await parseJson(res);
      if (!res.ok) {
        throw new Error(extractMessage(payload, "Không thể tải chi tiết đơn hàng."));
      }

      setOrder(payload?.data ?? payload);
    } catch (err) {
      setError(err?.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyReviews() {
    if (!token) {
      setMyReviewByOrderItemId({});
      return;
    }

    setReviewsLoading(true);
    setReviewError("");

    try {
      const res = await fetch(`${API_REVIEWS_URL}/me?page=0&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await parseJson(res);

      if (!res.ok) {
        throw new Error(extractMessage(payload, "Không thể tải đánh giá của bạn."));
      }

      const list = payload?.result ?? payload?.data?.result ?? [];
      const reviews = Array.isArray(list) ? list : [];

      const map = {};
      reviews.forEach((review) => {
        if (review?.orderItemId != null) {
          map[String(review.orderItemId)] = review;
        }
      });

      setMyReviewByOrderItemId(map);
    } catch (err) {
      setReviewError(err?.message || "Không thể tải đánh giá của bạn.");
    } finally {
      setReviewsLoading(false);
    }
  }

  function openDraftFor(item) {
    setReviewDraftOrderItemId(item?.orderItemId ?? null);
    setDraftStar(5);
    setDraftContent("");
    setDraftImages([]);
    setReviewError("");
  }

  function closeDraft() {
    setReviewDraftOrderItemId(null);
    setDraftStar(5);
    setDraftContent("");
    setDraftImages([]);
    setReviewError("");
  }

  async function submitReview(item) {
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

      draftImages.forEach((file) => formData.append("images", file));

      const res = await fetch(API_REVIEWS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await parseJson(res);
      if (!res.ok) {
        throw new Error(extractMessage(payload, "Không thể tạo đánh giá."));
      }

      const created = payload?.data ?? payload;
      const reviewOrderItemId = created?.orderItemId ?? payload?.orderItemId ?? orderItemIdValue;

      if (reviewOrderItemId != null) {
        setMyReviewByOrderItemId((prev) => ({
          ...prev,
          [String(reviewOrderItemId)]: created,
        }));
      }

      closeDraft();
    } catch (err) {
      setReviewError(err?.message || "Không thể tạo đánh giá.");
    } finally {
      setReviewBusy(false);
    }
  }

  function openEditReview(review) {
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
  }

  function closeEditReview() {
    setEditReviewId(null);
    setEditReviewError("");
  }

  async function saveEditReview(review) {
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

      const payload = await parseJson(res);
      if (!res.ok) {
        throw new Error(extractMessage(payload, "Không thể sửa đánh giá."));
      }

      await fetchMyReviews();
      setEditReviewSuccess("Đã sửa đánh giá thành công!");
      closeEditReview();
    } catch (err) {
      setEditReviewError(err?.message || "Không thể sửa đánh giá.");
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteReview(reviewId) {
    if (!reviewId) return;

    if (!token) {
      setAlertModal({ isOpen: true, message: "Bạn cần đăng nhập để xóa đánh giá." });
      return;
    }

    if (editBusy) return;

    setConfirmModal({
      isOpen: true,
      title: "Xóa đánh giá",
      message: "Bạn có chắc muốn xóa đánh giá này không?",
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
        setEditBusy(true);

        try {
          const res = await fetch(`${API_REVIEWS_URL}/${reviewId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          const payload = await parseJson(res);
          if (!res.ok) {
            throw new Error(extractMessage(payload, "Không thể xóa đánh giá."));
          }

          await fetchMyReviews();
          setAlertModal({ isOpen: true, message: "Đã xóa đánh giá thành công!" });
        } catch (err) {
          setAlertModal({ isOpen: true, message: err?.message || "Không thể xóa đánh giá." });
        } finally {
          setEditBusy(false);
        }
      },
    });
  }

  async function downloadInvoicePdf() {
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

      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-order-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      setInvoiceError(err?.message || "Không thể xuất hóa đơn.");
    } finally {
      setInvoiceBusy(false);
    }
  }

  const orderSummary = useMemo(() => {
    const orderStatusMeta = getOrderStatusMeta(order?.status);
    const paymentStatusMeta = getPaymentStatusMeta(paymentStatus);

    return [
      { label: "Trạng thái đơn hàng", value: orderStatusMeta.label, tone: orderStatusMeta.tone },
      { label: "Trạng thái thanh toán", value: paymentStatusMeta.label, tone: paymentStatusMeta.tone },
      { label: "Phương thức thanh toán", value: paymentMethod, tone: "slate" },
      { label: "Tổng tiền", value: formatVND(orderTotal), tone: "rose" },
    ];
  }, [order?.status, paymentMethod, paymentStatus, orderTotal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-lumiere-cream px-4 py-16">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-white/70 bg-white/70 py-24 shadow-sm backdrop-blur">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-lumiere-terracotta border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lumiere-cream py-10 sm:py-14">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lumiere-gray">Đơn hàng</p>
            <h1 className="serif mt-2 text-3xl font-light text-lumiere-charcoal sm:text-4xl">Chi tiết đơn hàng</h1>
            <p className="mt-2 text-sm text-lumiere-gray">
              Mã: <span className="font-mono font-bold text-lumiere-charcoal">{order?.orderCode ?? orderId}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/orders"
              className="inline-flex items-center justify-center rounded-xl border border-lumiere-gray/20 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-lumiere-charcoal transition hover:border-lumiere-charcoal hover:bg-lumiere-charcoal hover:text-white"
            >
              ← Quay lại
            </Link>

            {order?.paymentUrl ? (
              <a
                href={order.paymentUrl}
                className="inline-flex items-center justify-center rounded-xl bg-lumiere-terracotta px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
              >
                Thanh toán ngay
              </a>
            ) : null}

            {isInvoicePaid(order) ? (
              <button
                type="button"
                onClick={downloadInvoicePdf}
                disabled={invoiceBusy}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {invoiceBusy ? "Đang xuất..." : "Xuất hóa đơn"}
              </button>
            ) : null}
          </div>
        </div>

        {invoiceError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
            {invoiceError}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : !order ? (
          <div className="rounded-3xl border border-dashed border-lumiere-gray/25 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-lumiere-blush text-3xl">
              📦
            </div>
            <h2 className="serif text-3xl font-light text-lumiere-charcoal">Không tìm thấy đơn hàng</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-lumiere-gray">
              Đơn hàng có thể đã bị xoá hoặc bạn không có quyền xem.
            </p>
            <Link to="/orders" className="btn-primary mt-8 inline-flex">
              Quay lại danh sách
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <section className="rounded-3xl border border-lumiere-gray/15 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 border-b border-lumiere-gray/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="serif text-2xl font-light text-lumiere-charcoal">Sản phẩm trong đơn</h2>
                  <p className="mt-1 text-sm text-lumiere-gray">
                    {orderItems.length > 0 ? `${orderItems.length} sản phẩm` : "Chưa có sản phẩm"}
                  </p>
                </div>

                {orderRefundRelated ? (
                  <StatusPill label="Có yêu cầu trả hàng" tone="amber" />
                ) : null}
              </div>

              {reviewsLoading ? (
                <div className="mt-4 rounded-2xl bg-lumiere-blush/30 px-4 py-3 text-sm text-lumiere-gray">
                  Đang tải đánh giá...
                </div>
              ) : null}

              {reviewError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {reviewError}
                </div>
              ) : null}

              {editReviewError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {editReviewError}
                </div>
              ) : null}

              {editReviewSuccess ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {editReviewSuccess}
                </div>
              ) : null}

              <div className="mt-5 space-y-4">
                {orderItems.map((item) => {
                  const orderItemIdValue = item?.orderItemId;
                  const review = myReviewByOrderItemId[String(orderItemIdValue)] ?? null;
                  const productId = resolveProductId(item);
                  const isDraftOpen = reviewDraftOrderItemId === orderItemIdValue;
                  return (
                    <article key={String(orderItemIdValue ?? item.variantId ?? item.productName)} className="rounded-2xl border border-lumiere-gray/10 p-4">
                      <div className="flex gap-4">
                        <Link
                          to={productId ? `/product/${productId}` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-lumiere-gray/10 bg-lumiere-blush/40"
                        >
                          {item.thumbnailUrl ? (
                            <img src={getImageUrl(item.thumbnailUrl)} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-lumiere-gray">
                              No img
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <Link
                                to={productId ? `/product/${productId}` : "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate font-semibold text-lumiere-charcoal transition hover:text-lumiere-terracotta"
                              >
                                {item.productName}
                              </Link>

                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-lumiere-gray">
                                Màu: {item.color || "—"} · Size: {item.size || "—"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs uppercase tracking-[0.18em] text-lumiere-gray">SL</p>
                              <p className="font-bold text-lumiere-charcoal">{item.quantity}</p>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-lumiere-blush/30 px-3 py-2">
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lumiere-gray">Đơn giá</p>
                              <p className="mt-1 font-semibold text-lumiere-charcoal">{formatVND(item.unitPrice)}</p>
                            </div>

                            <div className="rounded-xl bg-lumiere-blush/30 px-3 py-2">
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lumiere-gray">Thành tiền</p>
                              <p className="mt-1 font-semibold text-lumiere-charcoal">{formatVND(item.lineTotal)}</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            {review ? (
                              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                                {editReviewId === review.reviewId ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <StatusPill label="Đang sửa đánh giá" tone="emerald" />
                                      <ReviewStars value={editDraftStar} />
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
                                            disabled={editBusy}
                                            className={`flex items-center justify-center rounded-xl border px-3 py-2 transition ${
                                              active
                                                ? "border-[#0066A2] bg-[#0066A2]/10 text-[#004b76]"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                          >
                                            <span className="material-symbols-outlined text-[18px]">star</span>
                                            <span className="ml-1 text-xs font-black">{star}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div>
                                      <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Nội dung</label>
                                      <textarea
                                        value={editDraftContent}
                                        onChange={(e) => setEditDraftContent(e.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10 disabled:opacity-50"
                                        placeholder="Chia sẻ trải nghiệm của bạn..."
                                        disabled={editBusy}
                                      />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={closeEditReview}
                                        disabled={editBusy}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => saveEditReview(review)}
                                        disabled={editBusy}
                                        className="rounded-xl bg-[#0066A2] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#005587] disabled:opacity-50"
                                      >
                                        {editBusy ? "Đang lưu..." : "Lưu"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <StatusPill label="Đã đánh giá" tone="emerald" />
                                      <ReviewStars value={review.starRating} />
                                    </div>

                                    {review.content ? (
                                      <p className="text-sm leading-6 text-slate-700 whitespace-pre-line">
                                        {review.content}
                                      </p>
                                    ) : null}

                                    {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {review.imageUrls.slice(0, 5).map((url, idx) => (
                                          <div key={String(url ?? idx)} className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                            <img
                                              src={getImageUrl(url)}
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

                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-xs text-slate-500">
                                        {review.createdAt ? `Gửi lúc ${formatDateTime(review.createdAt)}` : ""}
                                      </p>

                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openEditReview(review)}
                                          disabled={editBusy}
                                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                                        >
                                          Sửa
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteReview(review.reviewId)}
                                          disabled={editBusy}
                                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                        >
                                          Xóa
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : orderCompleted ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => openDraftFor(item)}
                                  className="rounded-xl border border-[#0066A2]/30 bg-[#0066A2]/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#004b76] transition hover:bg-[#0066A2]/10"
                                >
                                  Đánh giá sản phẩm
                                </button>

                                {isDraftOpen ? (
                                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <h3 className="text-sm font-black text-slate-900">Tạo đánh giá</h3>
                                      <span className="text-xs text-slate-500">1 - 5 sao</span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
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
                                                ? "border-[#0066A2] bg-[#0066A2]/10 text-[#004b76]"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                          >
                                            <span className="material-symbols-outlined text-[18px]">star</span>
                                            <span className="ml-1 text-xs font-black">{star}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div className="mt-3">
                                      <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Nội dung</label>
                                      <textarea
                                        value={draftContent}
                                        onChange={(e) => setDraftContent(e.target.value)}
                                        rows={3}
                                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0066A2] focus:ring-4 focus:ring-[#0066A2]/10"
                                        placeholder="Chia sẻ trải nghiệm của bạn..."
                                      />
                                    </div>

                                    <div className="mt-3">
                                      <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Ảnh đính kèm</label>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setDraftImages(Array.from(e.target.files || []).slice(0, 5))}
                                        className="mt-2 w-full text-sm"
                                      />

                                      {draftImagePreviews.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {draftImagePreviews.map((preview, idx) => (
                                            <div key={preview.key || idx} className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                              <img
                                                alt={`draft ${idx + 1}`}
                                                src={preview.url}
                                                className="h-full w-full object-cover"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>

                                    {reviewError ? (
                                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                                        {reviewError}
                                      </div>
                                    ) : null}

                                    <div className="mt-4 flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={closeDraft}
                                        disabled={reviewBusy}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => submitReview(item)}
                                        disabled={reviewBusy || draftStar < 1 || draftStar > 5}
                                        className="rounded-xl bg-[#0066A2] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#005587] disabled:opacity-50"
                                      >
                                        {reviewBusy ? "Đang gửi..." : "Gửi đánh giá"}
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-sm text-lumiere-gray">Chỉ có thể đánh giá khi đơn đã hoàn tất.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {orderItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-lumiere-gray/20 px-4 py-8 text-center text-sm text-lumiere-gray">
                    Không có dữ liệu sản phẩm.
                  </div>
                ) : null}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-lumiere-gray/15 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="serif text-2xl font-light text-lumiere-charcoal">Tóm tắt đơn hàng</h2>

                <div className="mt-5 grid gap-3">
                  {orderSummary.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-lumiere-blush/30 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lumiere-gray">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold text-lumiere-charcoal">{item.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-lumiere-gray/15 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="serif text-2xl font-light text-lumiere-charcoal">Thông tin nhận hàng</h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-lumiere-gray">Người nhận</p>
                    <p className="mt-1 font-semibold text-lumiere-charcoal">{order.recipientName || "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-lumiere-gray">SĐT</p>
                    <p className="mt-1 font-semibold text-lumiere-charcoal">{order.recipientPhone || "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-lumiere-gray">Địa chỉ</p>
                    <p className="mt-1 font-semibold leading-6 text-lumiere-charcoal">{order.addressLine || "—"}</p>
                  </div>

                  {order.voucherCode ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-lumiere-gray">Voucher</p>
                      <p className="mt-1 font-semibold text-lumiere-charcoal">{order.voucherCode}</p>
                    </div>
                  ) : null}

                  {order.note ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-lumiere-gray">Ghi chú</p>
                      <p className="mt-1 font-semibold leading-6 text-lumiere-charcoal">{order.note}</p>
                    </div>
                  ) : null}

                  {order.trackingCode ? (
                    <div className="rounded-2xl bg-lumiere-charcoal p-4 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Mã vận đơn</p>
                      <p className="mt-1 font-mono text-sm font-bold tracking-wider">{order.trackingCode}</p>
                    </div>
                  ) : null}

                  {order.cancelReason ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-lumiere-gray">Lý do hủy</p>
                      <p className="mt-1 font-semibold leading-6 text-lumiere-charcoal">{order.cancelReason}</p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-3xl border border-lumiere-gray/15 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="serif text-2xl font-light text-lumiere-charcoal">Thanh toán</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lumiere-gray">Phương thức</span>
                    <span className="font-semibold text-lumiere-charcoal">{paymentMethod}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lumiere-gray">Trạng thái</span>
                    <span className="font-semibold text-lumiere-charcoal">{getPaymentStatusMeta(paymentStatus).label}</span>
                  </div>

                  {order.payment?.vnpayTransactionNo ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lumiere-gray">VNPAY TXN</span>
                      <span className="font-semibold text-lumiere-charcoal">{order.payment.vnpayTransactionNo}</span>
                    </div>
                  ) : null}

                  {order.payment?.paidAt ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lumiere-gray">Paid at</span>
                      <span className="font-semibold text-lumiere-charcoal">{formatDateTime(order.payment.paidAt)}</span>
                    </div>
                  ) : null}
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>

      {confirmModal.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-black text-slate-900">{confirmModal.title}</h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-rose-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {alertModal.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-black text-slate-900">Thông báo</h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">{alertModal.message}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAlertModal({ isOpen: false, message: "" })}
                className="rounded-xl bg-[#0066A2] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#005587]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
