import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StarRating } from '../../components/StarRating';
import { BarChart3, TrendingUp, Award, DollarSign } from 'lucide-react';

export function AdminReports() {
  const [reports, setReports] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [repRes, dashRes] = await Promise.all([
          api.get('/admin/reports'),
          api.get('/admin/dashboard'),
        ]);
        if (repRes.success) setReports(repRes.data);
        if (dashRes.success) setDashboard(dashRes.data);
      } catch (e) {
        console.error('Failed to load reports', e);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const leaderBoard = reports?.leaderBoard || [];
  const summary = dashboard?.summary || {};
  const ordersByCategory = dashboard?.ordersByCategory || [];

  return (
    <DashboardLayout
      title="Platform Performance Analytics"
      subtitle="Executive summary of service provider performance, category demand metrics, and marketplace revenue."
    >
      <div className="space-y-8">
        {/* Top Performer Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Top Service Providers by Rating & Quality</h3>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading leaderboard...</div>
          ) : leaderBoard.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No provider rating statistics available.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaderBoard.map((p, idx) => (
                <div key={p.providerId} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {p.avgRating ? `${p.avgRating} / 5.0` : '5.0'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{p.businessName}</h4>
                  <p className="text-xs text-slate-500">Operated by {p.providerName}</p>

                  <div className="pt-2 border-t border-slate-200">
                    <StarRating rating={p.avgRating || 5.0} count={p.reviewCount} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Volume & Revenue Aggregation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Service Demand Distribution
            </h3>

            <div className="space-y-3">
              {ordersByCategory.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{c.name}</span>
                    <span className="font-bold text-slate-900">{c.count} bookings</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (c.count / (summary.totalOrders || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              Completed Value Economics
            </h3>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                Gross Completed Transaction Value
              </span>
              <p className="text-3xl font-black text-purple-900">
                ${Number(summary.completedRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-purple-700">
                Calculated dynamically from fulfilled order price snapshots.
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-2 pt-2">
              <p>
                <strong>Total Orders Created:</strong> {summary.totalOrders || 0}
              </p>
              <p>
                <strong>Total Verified Providers:</strong> {summary.approvedProviders || 0}
              </p>
              <p>
                <strong>Customer Satisfaction Score:</strong> {summary.avgPlatformRating || 5.0} / 5.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
