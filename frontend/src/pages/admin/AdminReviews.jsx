import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StarRating } from '../../components/StarRating';
import { Star, EyeOff, Eye, AlertCircle, ShieldAlert } from 'lucide-react';

export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const query = filter ? `?${filter}` : '';
      const res = await api.get(`/admin/reviews${query}`);
      if (res.success) {
        setReviews(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const handleModerate = async (reviewId, isHidden, isReported) => {
    try {
      await api.patch(`/admin/reviews/${reviewId}/moderate`, {
        isHidden,
        isReported,
      });
      await loadReviews();
    } catch (err) {
      alert(err.message || 'Failed to moderate review');
    }
  };

  return (
    <DashboardLayout
      title="Customer Reviews & Moderation Queue"
      subtitle="Investigate reported feedback, manage public review visibility, and maintain platform trust."
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { label: 'All Reviews', value: '' },
            { label: 'Reported Queue', value: 'isReported=true' },
            { label: 'Hidden from Public', value: 'isHidden=true' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === item.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">No reviews found matching filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Reviewer</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Order / Service</th>
                    <th className="py-3 px-4">Rating & Feedback</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{r.customer?.fullName}</p>
                        <p className="text-[10px] text-slate-400">{r.customer?.email}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.provider?.providerProfile?.businessName || r.provider?.fullName}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-medium">{r.order?.serviceNameSnapshot}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{r.order?.orderNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <StarRating rating={r.rating} showCount={false} size="sm" />
                        {r.comment && (
                          <p className="mt-1 text-slate-600 line-clamp-2 italic">
                            "{r.comment}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        {r.isReported && (
                          <span className="block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Reported
                          </span>
                        )}
                        {r.isHidden && (
                          <span className="block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Hidden
                          </span>
                        )}
                        {!r.isReported && !r.isHidden && (
                          <span className="block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Public
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {r.isReported && (
                          <button
                            onClick={() => handleModerate(r.id, r.isHidden, false)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px]"
                          >
                            Dismiss Flag
                          </button>
                        )}

                        {r.isHidden ? (
                          <button
                            onClick={() => handleModerate(r.id, false, r.isReported)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleModerate(r.id, true, r.isReported)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] font-semibold"
                          >
                            Hide Review
                          </button>
                        )}
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
