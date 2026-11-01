import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { StarRating } from '../../components/StarRating';
import {
  Inbox,
  Clock,
  CheckCircle2,
  DollarSign,
  Star,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export function ProviderOverview() {
  const [data, setData] = useState(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [dashRes, availRes] = await Promise.all([
        api.get('/provider/dashboard'),
        api.get('/provider/orders/available').catch(() => ({ data: [] })),
      ]);
      if (dashRes.success) {
        setData(dashRes.data);
      }
      if (availRes.success) {
        setAvailableCount(availRes.data?.length || 0);
      }
    } catch (e) {
      console.error('Failed to load provider dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleAvailability = async () => {
    if (!data?.profile) return;
    setTogglingAvail(true);
    try {
      await api.put('/provider/profile', {
        isAvailable: !data.profile.isAvailable,
      });
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to update availability');
    } finally {
      setTogglingAvail(false);
    }
  };

  const metrics = data?.metrics || {};
  const profile = data?.profile;
  const recentOrders = data?.recentOrders || [];

  return (
    <DashboardLayout
      title="Provider Dashboard"
      subtitle={`Welcome back, ${profile?.businessName || 'Partner'}! Manage assignments and track earnings.`}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAvailability}
            disabled={togglingAvail}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              profile?.isAvailable
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {profile?.isAvailable ? (
              <>
                <ToggleRight className="w-4 h-4 text-emerald-600" />
                Available for Orders
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                Set to Away
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Verification Alert Banner if not approved */}
        {profile?.verificationStatus !== 'APPROVED' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Account Verification: {profile?.verificationStatus}</h4>
              <p className="mt-0.5 text-amber-800">
                Your profile is currently under review by our administrative team. Once approved, you can accept incoming bookings.
              </p>
            </div>
          </div>
        )}

        {/* Incoming available requests alert */}
        {availableCount > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-indigo-500/10 border border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {availableCount} Incoming Service Request{availableCount > 1 ? 's' : ''} Waiting!
                </h4>
                <p className="text-xs text-slate-500">Orders matching your active service catalog are ready for review.</p>
              </div>
            </div>

            <Link
              to="/provider/incoming"
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              Review Requests
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Jobs"
            value={metrics.activeJobs || 0}
            icon={Clock}
            color="sky"
            subtitle="Accepted or In Progress"
          />
          <StatCard
            title="Completed Jobs"
            value={metrics.completedCount || 0}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Fulfilled orders"
          />
          <StatCard
            title="Gross Completed Value"
            value={`$${Number(metrics.grossEarnings || 0).toFixed(2)}`}
            icon={DollarSign}
            color="indigo"
            subtitle="Based on completed jobs"
          />
          <StatCard
            title="Rating Standing"
            value={metrics.avgRating ? `${metrics.avgRating} / 5.0` : '5.0 / 5.0'}
            icon={Star}
            color="amber"
            subtitle={`${metrics.reviewCount || 0} customer reviews`}
          />
        </div>

        {/* Recent Jobs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Assigned Jobs</h3>
            <Link to="/provider/active" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Active Jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading assignments...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No jobs assigned to your account yet.</p>
              <Link to="/provider/incoming" className="inline-block text-indigo-600 font-semibold hover:underline">
                Check incoming marketplace requests
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Scheduled</th>
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
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(order.scheduledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
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
