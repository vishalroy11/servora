import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { ShoppingBag, Calendar, ArrowRight, Filter } from 'lucide-react';

export function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const res = await api.get(`/orders/my-orders${query}`);
        if (res.success) {
          setOrders(res.data.items || []);
        }
      } catch (e) {
        console.error('Failed to load orders', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [statusFilter]);

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
      title="My Bookings & Orders"
      subtitle="View detailed timelines, track assigned providers, and manage your service requests."
      actions={
        <Link
          to="/services"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Calendar className="w-4 h-4" /> Book New Service
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No orders found matching this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Assigned Provider</th>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4">Agreed Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{order.serviceNameSnapshot}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {order.provider?.providerProfile?.businessName || order.provider?.fullName || (
                          <span className="text-slate-400 italic">Open Request</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(order.scheduledAt).toLocaleDateString()} {new Date(order.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ${Number(order.servicePrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/customer/orders/${order.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View Timeline <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
