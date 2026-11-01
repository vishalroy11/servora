import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StarRating } from '../../components/StarRating';
import { Star } from 'lucide-react';

export function ProviderReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      if (!user) return;
      try {
        const res = await api.get(`/providers/${user.id}`);
        if (res.success) {
          setReviews(res.data.recentReviews || []);
          setAvgRating(res.data.avgRating);
        }
      } catch (e) {
        console.error('Failed to load provider reviews', e);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [user]);

  return (
    <DashboardLayout
      title="Customer Feedback & Ratings"
      subtitle="Verified reviews and evaluations submitted by customers after job completion."
      actions={
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-xl text-xs font-bold text-amber-900">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          Average Platform Standing: {avgRating ? `${avgRating} / 5.0` : '5.0 / 5.0'}
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
            <Star className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No customer reviews received yet.</p>
            <p className="text-[11px] text-slate-400">Reviews appear here once customers confirm and evaluate completed orders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{rev.customer?.fullName || 'Verified Customer'}</h4>
                    <p className="text-xs text-slate-500">Service: {rev.order?.serviceNameSnapshot}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Order #{rev.order?.orderNumber}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <StarRating rating={rev.rating} showCount={false} size="sm" />

                {rev.comment && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
