import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { OrderTimeline } from '../../components/OrderTimeline';
import { StarRating } from '../../components/StarRating';
import { Modal } from '../../components/Modal';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Star,
} from 'lucide-react';

export function CustomerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals & form state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
      setCancelModalOpen(false);
      await fetchOrder();
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/confirm`);
      await fetchOrder();
    } catch (err) {
      alert(err.message || 'Failed to confirm completion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeOrder = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/dispute`, { reason: disputeReason });
      setDisputeModalOpen(false);
      await fetchOrder();
    } catch (err) {
      alert(err.message || 'Failed to dispute order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      await api.post(`/reviews/orders/${id}/review`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      await fetchOrder();
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Order Details">
        <div className="text-center py-20 text-xs text-slate-400">Loading order timeline...</div>
      </DashboardLayout>
    );
  }

  if (errorMsg || !order) {
    return (
      <DashboardLayout title="Order Not Found">
        <div className="max-w-md mx-auto py-12 text-center space-y-3">
          <p className="text-xs text-slate-500">{errorMsg || 'Could not locate order details.'}</p>
          <Link to="/customer/orders" className="text-xs font-semibold text-indigo-600 hover:underline">
            Back to my bookings
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const canCancel = ['PENDING', 'ACCEPTED'].includes(order.status);
  const canConfirm = ['IN_PROGRESS', 'COMPLETED'].includes(order.status) && !order.customerConfirmedAt;
  const canDispute = ['IN_PROGRESS', 'COMPLETED'].includes(order.status);
  const canReview = order.status === 'COMPLETED' && !order.review;

  return (
    <DashboardLayout
      title={`Order ${order.orderNumber}`}
      subtitle={`Created on ${new Date(order.createdAt).toLocaleString()}`}
      actions={
        <Link
          to="/customer/orders"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Status Header & Stepper Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {order.service?.category?.name || 'Service'}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{order.serviceNameSnapshot}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-slate-900">${Number(order.servicePrice).toFixed(2)}</span>
              <StatusBadge status={order.status} size="lg" />
            </div>
          </div>

          {/* Interactive Stepper */}
          <OrderTimeline
            status={order.status}
            events={order.events}
            createdAt={order.createdAt}
            acceptedAt={order.acceptedAt}
            startedAt={order.startedAt}
            completedAt={order.completedAt}
            cancelledAt={order.cancelledAt}
          />
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Booking & Location Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Appointment Specifications</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Service Address Snapshot</span>
                  <p className="font-semibold text-slate-800 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    {order.serviceAddress}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Scheduled Date & Time</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    {new Date(order.scheduledAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Agreed Price Snapshot</span>
                  <p className="font-extrabold text-emerald-600 text-sm">
                    ${Number(order.servicePrice).toFixed(2)}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Payment Status</span>
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    {order.payment?.paymentStatus || 'PENDING'} · {order.payment?.paymentMethod || 'CARD'}
                  </p>
                </div>
              </div>

              {order.customerInstructions && (
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 block mb-1">Customer Instructions</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{order.customerInstructions}"
                  </p>
                </div>
              )}

              {order.cancellationReason && (
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <span className="text-rose-500 font-bold block mb-1">Cancellation Reason ({order.cancelledBy})</span>
                  <p className="text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-100">
                    {order.cancellationReason}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Action Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center gap-3">
              {canConfirm && (
                <button
                  onClick={handleConfirmCompletion}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Service Satisfied
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Booking
                </button>
              )}

              {canDispute && (
                <button
                  onClick={() => setDisputeModalOpen(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Report Issue / Dispute
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Provider Information & Review Section */}
          <div className="space-y-6">
            {/* Assigned Provider Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Assigned Professional</h3>

              {order.provider ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {order.provider.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {order.provider.providerProfile?.businessName || order.provider.fullName}
                      </h4>
                      <p className="text-xs text-slate-500">{order.provider.fullName}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                    <p><strong>Phone:</strong> {order.provider.phone || 'Available after confirmation'}</p>
                    <p><strong>Email:</strong> {order.provider.email}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <p className="font-bold">Open Marketplace Booking</p>
                  <p className="text-[11px] text-amber-800">
                    Awaiting acceptance from eligible verified service providers in your service zone.
                  </p>
                </div>
              )}
            </div>

            {/* Review Section */}
            {order.review ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Your Submitted Review</h3>
                  <span className="text-[10px] text-slate-400">
                    {new Date(order.review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <StarRating rating={order.review.rating} showCount={false} size="md" />

                {order.review.comment && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{order.review.comment}"
                  </p>
                )}
              </div>
            ) : canReview ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  Rate Your Experience
                </div>
                <p className="text-xs text-slate-500">
                  Service is complete! Help the community by rating this professional's service quality.
                </p>

                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Star Rating (1 - 5)</label>
                    <StarRating
                      rating={reviewRating}
                      interactive={true}
                      onChange={(star) => setReviewRating(star)}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Written Feedback</label>
                    <textarea
                      rows={3}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share specifics about timeliness, cleanliness, and professionalism..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    {reviewSubmitting ? 'Submitting Review...' : 'Submit 5-Star Review'}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Service Booking">
        <form onSubmit={handleCancelOrder} className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you wish to cancel this appointment? Please state the reason for our records:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason</label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, decided to reschedule..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Keep Booking
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={disputeModalOpen} onClose={() => setDisputeModalOpen(false)} title="Report Issue / Dispute">
        <form onSubmit={handleDisputeOrder} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please describe the issue encountered with this order. An administrator will review the case details and timeline history:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Details</label>
            <textarea
              rows={4}
              required
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain the problem in detail..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDisputeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
            >
              {actionLoading ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
