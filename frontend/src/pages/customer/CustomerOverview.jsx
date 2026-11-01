import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ShoppingBag, Clock, CheckCircle2, DollarSign, ArrowRight, Calendar, Star } from 'lucide-react';

export function CustomerOverview() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.success) {
          setOrders(res.data.items || []);
        }
      } catch (e) {
        console.error('Failed to load customer orders', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const totalBookings = orders.length;
  const activeBookings = orders.filter((o) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(o.status)).length;
  const completedBookings = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalSpent = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (Number(o.servicePrice) || 0), 0);

  const recentOrders = orders.slice(0, 5);

  return (
    <DashboardLayout
      title="Customer Dashboard"
      subtitle="Track your active appointments, view past orders, and manage service requests."
      actions={
        <Link
          to="/services"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Calendar className="w-4 h-4" /> Book New Service
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={totalBookings}
            icon={ShoppingBag}
            color="indigo"
            subtitle="All time requests"
          />
          <StatCard
            title="Active Jobs"
            value={activeBookings}
            icon={Clock}
            color="sky"
            subtitle="Pending, Accepted, In-Progress"
          />
          <StatCard
            title="Completed"
            value={completedBookings}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Fulfilled services"
          />
          <StatCard
            title="Total Spent"
            value={`$${totalSpent.toFixed(2)}`}
            icon={DollarSign}
            color="purple"
            subtitle="Completed services"
          />
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Service Bookings</h3>
            <Link to="/customer/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading your bookings...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
              <p>You haven't booked any services yet.</p>
              <Link to="/services" className="inline-block text-indigo-600 font-semibold hover:underline">
                Browse our directory of verified professionals
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Scheduled</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{order.serviceNameSnapshot}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {order.provider?.providerProfile?.businessName || order.provider?.fullName || 'Open Request'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(order.scheduledAt).toLocaleDateString()}
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
                          className="font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View Details
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
