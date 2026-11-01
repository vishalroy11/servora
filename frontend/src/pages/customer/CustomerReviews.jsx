import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StarRating } from '../../components/StarRating';
import { Star, ArrowRight } from 'lucide-react';

export function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await api.get('/reviews/my-reviews');
        if (res.success) {
          setReviews(res.data);
        }
      } catch (e) {
        console.error('Failed to load customer reviews', e);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  return (
    <DashboardLayout
      title="My Reviews & Ratings"
      subtitle="Feedback and ratings you've submitted for completed service appointments."
    >
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
            <Star className="w-8 h-8 text-slate-300 mx-auto" />
            <p>You haven't submitted any reviews yet.</p>
            <p className="text-[11px] text-slate-400">Reviews can be submitted upon completion of any booking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{rev.provider?.businessName}</h4>
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

                <div className="pt-2 border-t border-slate-100 text-right">
                  <Link
                    to={`/customer/orders/${rev.orderId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Order <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
