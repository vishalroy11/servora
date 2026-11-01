import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { StarRating } from '../../components/StarRating';
import { FileText, DollarSign, Calendar } from 'lucide-react';

export function ProviderOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get('/provider/orders');
        if (res.success) {
          // Completed or Cancelled
          const past = (res.data || []).filter((o) => ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(o.status));
          setOrders(past);
        }
      } catch (e) {
        console.error('Failed to load past orders', e);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const totalEarnings = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (Number(o.servicePrice) || 0), 0);

  return (
    <DashboardLayout
      title="Job Fulfillment History"
      subtitle="Complete record of fulfilled and resolved service appointments."
      actions={
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
          Total Fulfilled Value: ${totalEarnings.toFixed(2)}
        </div>
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading order history...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">No Fulfilled Jobs Yet</h3>
            <p className="text-slate-400">Completed jobs and historical receipts will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Completed On</th>
                  <th className="py-3 px-4">Gross Value</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{order.serviceNameSnapshot}</td>
                    <td className="py-3.5 px-4 text-slate-600">{order.customer?.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ${Number(order.servicePrice).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.review ? (
                        <StarRating rating={order.review.rating} showCount={false} size="sm" />
                      ) : (
                        <span className="text-slate-400 italic">No review</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
