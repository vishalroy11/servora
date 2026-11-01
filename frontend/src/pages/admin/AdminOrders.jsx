import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { OrderTimeline } from '../../components/OrderTimeline';
import { Search, ShoppingBag, Clock, History, Calendar, User, MapPin } from 'lucide-react';

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Audit Events Modal
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderEvents, setOrderEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('q', searchQuery);
      params.append('pageSize', '50');

      const res = await api.get(`/admin/orders?${params.toString()}`);
      if (res.success) {
        setOrders(res.data.items || []);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, searchQuery]);

  const handleOpenAudit = async (order) => {
    setSelectedOrder(order);
    setAuditModalOpen(true);
    setEventsLoading(true);
    try {
      const res = await api.get(`/admin/orders/${order.id}/events`);
      if (res.success) {
        setOrderEvents(res.data || []);
      }
    } catch (err) {
      alert(err.message || 'Failed to load order audit events');
    } finally {
      setEventsLoading(false);
    }
  };

  const tabs = [
    { label: 'All Orders', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Disputed', value: 'DISPUTED' },
  ];

  return (
    <DashboardLayout
      title="Platform Orders & Audit History"
      subtitle="Complete chronological audit trail of all customer bookings, provider assignments, and lifecycle states."
    >
      <div className="space-y-6">
        {/* Search & Status Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, or service..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading marketplace orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">No orders found matching filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Assigned Provider</th>
                    <th className="py-3 px-4">Agreed Value</th>
                    <th className="py-3 px-4">Scheduled</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{o.orderNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{o.serviceNameSnapshot}</td>
                      <td className="py-3.5 px-4 text-slate-600">{o.customer?.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {o.provider?.providerProfile?.businessName || o.provider?.fullName || (
                          <span className="text-slate-400 italic">Open Request</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ${Number(o.servicePrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(o.scheduledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAudit(o)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          Audit History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Audit History Modal */}
      <Modal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title={`Audit Trail: ${selectedOrder?.orderNumber}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {selectedOrder.service?.category?.name}
                </p>
                <h4 className="text-base font-bold text-slate-900">{selectedOrder.serviceNameSnapshot}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: <strong>{selectedOrder.customer?.fullName}</strong> · Provider:{' '}
                  <strong>{selectedOrder.provider?.fullName || 'None'}</strong>
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedOrder.status} size="lg" />
                <p className="text-xs font-bold text-emerald-600 mt-1">${Number(selectedOrder.servicePrice).toFixed(2)}</p>
              </div>
            </div>

            {/* Chronological Event Stepper */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Chronological OrderEvent Table Log
              </h4>

              {eventsLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading audit records...</div>
              ) : orderEvents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No events recorded for this order.</div>
              ) : (
                <div className="space-y-3">
                  {orderEvents.map((ev, index) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-start justify-between shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{ev.eventType.replace(/_/g, ' ')}</span>
                          {ev.oldStatus && ev.newStatus && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {ev.oldStatus} → {ev.newStatus}
                            </span>
                          )}
                        </div>
                        {ev.note && <p className="text-slate-600 italic">"{ev.note}"</p>}
                        {ev.actor && (
                          <p className="text-[10px] text-slate-400">
                            Actor: {ev.actor.fullName} ({ev.actor.role})
                          </p>
                        )}
                      </div>
                      <span className="text-slate-400 text-[10px] font-mono shrink-0 ml-4">
                        {new Date(ev.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Close Audit View
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
