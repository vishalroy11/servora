import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Users,
  ShieldCheck,
  ShoppingBag,
  DollarSign,
  Star,
  FolderTree,
  Wrench,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.success) {
          setData(res.data);
        }
      } catch (e) {
        console.error('Failed to load admin dashboard', e);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const summary = data?.summary || {};
  const ordersByStatus = data?.ordersByStatus || {};
  const ordersByCategory = data?.ordersByCategory || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <DashboardLayout
      title="Platform Operations Center"
      subtitle="Real-time PostgreSQL analytics, user statistics, order workflows, and marketplace revenue."
    >
      <div className="space-y-8">
        {/* Pending approvals alert */}
        {summary.pendingProviders > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-600 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  {summary.pendingProviders} Provider Application{summary.pendingProviders > 1 ? 's' : ''} Awaiting Approval
                </h4>
                <p className="text-xs text-amber-800">Review business licenses, service zones, and verify credentials.</p>
              </div>
            </div>

            <Link
              to="/admin/providers"
              className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs"
            >
              Review Queue
            </Link>
          </div>
        )}

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered Users"
            value={summary.totalUsers || 0}
            icon={Users}
            color="indigo"
            subtitle={`${summary.totalCustomers || 0} customers · ${summary.totalProviders || 0} providers`}
          />
          <StatCard
            title="Total Orders"
            value={summary.totalOrders || 0}
            icon={ShoppingBag}
            color="sky"
            subtitle="Platform-wide bookings"
          />
          <StatCard
            title="Completed Service Value"
            value={`$${Number(summary.completedRevenue || 0).toFixed(2)}`}
            icon={DollarSign}
            color="emerald"
            subtitle="Fulfilled transactions"
          />
          <StatCard
            title="Platform Standing"
            value={summary.avgPlatformRating ? `${summary.avgPlatformRating} / 5.0` : '5.0 / 5.0'}
            icon={Star}
            color="amber"
            subtitle={`${summary.totalReviews || 0} customer reviews`}
          />
        </div>

        {/* Status Breakdown & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Orders by Lifecycle State</h3>
              <Link to="/admin/orders" className="text-xs font-semibold text-indigo-600 hover:underline">
                View orders
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Pending', count: ordersByStatus.PENDING || 0, status: 'PENDING' },
                { label: 'Accepted', count: ordersByStatus.ACCEPTED || 0, status: 'ACCEPTED' },
                { label: 'In Progress', count: ordersByStatus.IN_PROGRESS || 0, status: 'IN_PROGRESS' },
                { label: 'Completed', count: ordersByStatus.COMPLETED || 0, status: 'COMPLETED' },
                { label: 'Cancelled', count: ordersByStatus.CANCELLED || 0, status: 'CANCELLED' },
                { label: 'Disputed', count: ordersByStatus.DISPUTED || 0, status: 'DISPUTED' },
              ].map((item) => (
                <div key={item.status} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    <p className="text-lg font-black text-slate-800">{item.count}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Categories Demand */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Demand by Service Category</h3>
              <Link to="/admin/categories" className="text-xs font-semibold text-indigo-600 hover:underline">
                Manage categories
              </Link>
            </div>

            {ordersByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No order category distribution data.</p>
            ) : (
              <div className="space-y-2.5">
                {ordersByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (cat.count / (summary.totalOrders || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-6 text-right">{cat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Platform Orders</h3>
            <Link to="/admin/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All Platform Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No orders recorded in system.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{order.orderNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{order.serviceNameSnapshot}</td>
                      <td className="py-3.5 px-4 text-slate-600">{order.customer?.fullName}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {order.provider?.fullName || <span className="text-slate-400 italic">Open Request</span>}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ${Number(order.servicePrice).toFixed(2)}
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
      </div>
    </DashboardLayout>
  );
}
