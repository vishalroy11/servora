import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';

export function IncomingRequests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const loadAvailableOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/provider/orders/available');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load available orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableOrders();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.post(`/provider/orders/${orderId}/accept`);
      setFeedback({
        type: 'success',
        message: `Order ${res.data.orderNumber} successfully accepted! View it under Active Jobs.`,
      });
      await loadAvailableOrders();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not accept order (may have been claimed by another provider).',
      });
      await loadAvailableOrders();
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (orderId) => {
    setRejectOrderId(orderId);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/provider/orders/${rejectOrderId}/reject`, { note: rejectNote });
      setRejectModalOpen(false);
      setFeedback({
        type: 'info',
        message: 'Order offer declined. The order remains open to other eligible providers.',
      });
      await loadAvailableOrders();
    } catch (err) {
      alert(err.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Incoming Service Requests"
      subtitle="Eligible customer bookings matching your active service offerings and service zone."
    >
      <div className="space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Inbox className="w-5 h-5 text-sky-600 shrink-0" />
            )}
            <div>{feedback.message}</div>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading incoming requests...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-xs text-slate-500 space-y-3">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">No Pending Requests at this Moment</h3>
            <p className="max-w-md mx-auto text-slate-400">
              When customers schedule services matching your catalog offerings, they will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{order.orderNumber}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {order.service?.category?.name}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{order.serviceNameSnapshot}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      Scheduled: <strong>{new Date(order.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      Location: <span className="font-medium">{order.serviceAddress}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      Customer: <span className="font-medium">{order.customer?.fullName}</span>
                    </p>
                  </div>

                  {order.customerInstructions && (
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 italic">
                      <span className="font-semibold text-slate-700 not-italic">Notes: </span>
                      "{order.customerInstructions}"
                    </div>
                  )}
                </div>

                {/* Pricing & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-400 block">Agreed Price</span>
                    <span className="text-2xl font-black text-emerald-600">
                      ${Number(order.servicePrice).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReject(order.id)}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                    >
                      Accept Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decline Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Decline Service Request">
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-slate-600">
            Declining this order will remove it from your incoming feed. The request will remain available to other eligible providers in the marketplace.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason (Optional)</label>
            <input
              type="text"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Fully booked at this time, outside immediate route..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
            >
              {actionLoading ? 'Declining...' : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
