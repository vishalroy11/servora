import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { OrderTimeline } from '../../components/OrderTimeline';
import { Clock, Play, CheckCircle2, MapPin, Calendar, User, Phone, Mail } from 'lucide-react';

export function ProviderActiveOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadActiveOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/provider/orders');
      if (res.success) {
        // Filter active
        const active = (res.data || []).filter((o) => ['ACCEPTED', 'IN_PROGRESS'].includes(o.status));
        setOrders(active);
      }
    } catch (e) {
      console.error('Failed to load active orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveOrders();
  }, []);

  const handleStartService = async (orderId) => {
    setActionLoading(true);
    try {
      await api.post(`/provider/orders/${orderId}/start`);
      await loadActiveOrders();
    } catch (err) {
      alert(err.message || 'Failed to start service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async (orderId) => {
    setActionLoading(true);
    try {
      await api.post(`/provider/orders/${orderId}/complete`);
      await loadActiveOrders();
    } catch (err) {
      alert(err.message || 'Failed to complete service');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Active Appointments & Jobs"
      subtitle="Orders currently in Accepted or In-Progress status assigned to your business."
    >
      <div className="space-y-6">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading active appointments...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-xs text-slate-500 space-y-3">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">No Active Jobs Currently in Progress</h3>
            <p className="text-slate-400">Check the Incoming Requests tab to accept new service assignments.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{order.serviceNameSnapshot}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Agreed Value</span>
                      <span className="text-2xl font-black text-emerald-600">
                        ${Number(order.servicePrice).toFixed(2)}
                      </span>
                    </div>

                    {order.status === 'ACCEPTED' ? (
                      <button
                        onClick={() => handleStartService(order.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Start Service
                      </button>
                    ) : order.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={() => handleCompleteService(order.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Client Details</h4>
                    <p className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <strong>Name:</strong> {order.customer?.fullName}
                    </p>
                    <p className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <strong>Phone:</strong> {order.customer?.phone || 'Not provided'}
                    </p>
                    <p className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <strong>Email:</strong> {order.customer?.email}
                    </p>
                  </div>

                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Job Logistics</h4>
                    <p className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <strong>Address:</strong> {order.serviceAddress}
                    </p>
                    <p className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <strong>Appointment:</strong> {new Date(order.scheduledAt).toLocaleString()}
                    </p>
                    {order.customerInstructions && (
                      <p className="text-slate-600 italic pt-1 border-t border-slate-200">
                        "{order.customerInstructions}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Timeline */}
                <OrderTimeline
                  status={order.status}
                  events={order.events}
                  createdAt={order.createdAt}
                  acceptedAt={order.acceptedAt}
                  startedAt={order.startedAt}
                  completedAt={order.completedAt}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
