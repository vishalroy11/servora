import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { StarRating } from '../../components/StarRating';
import { BookServiceModal } from '../../components/BookServiceModal';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  UserCheck,
  Star,
  Tag,
} from 'lucide-react';

export function ProviderProfilePage() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Booking modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    async function loadProvider() {
      setLoading(true);
      try {
        const res = await api.get(`/providers/${id}`);
        if (res.success) {
          setProvider(res.data);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Provider not found');
      } finally {
        setLoading(false);
      }
    }
    loadProvider();
  }, [id]);

  const handleBookService = (serviceItem) => {
    setSelectedService({
      id: serviceItem.service.id,
      name: serviceItem.service.name,
      basePrice: serviceItem.price,
      category: serviceItem.service.category,
    });
    setModalOpen(true);
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading provider profile...</div>;
  }

  if (errorMsg || !provider) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Provider Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'The requested provider profile does not exist.'}</p>
        <Link to="/services" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <Link to="/services" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Provider
            </span>
            {provider.isAvailable ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                ● Available for New Bookings
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                Unavailable
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{provider.businessName}</h1>
          <p className="text-xs font-semibold text-slate-500">Operated by {provider.user?.fullName}</p>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {provider.bio || 'Licensed and insured professional providing guaranteed local workmanship.'}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400" /> {provider.serviceArea || 'Metro & Surrounding Areas'}
            </span>
          </div>
        </div>

        {/* Rating summary badge */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shrink-0 sm:w-64 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-slate-500">Customer Rating</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-black text-slate-900">
              {provider.avgRating ? Number(provider.avgRating).toFixed(1) : '5.0'}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
          </div>
          <div className="mt-2">
            <StarRating rating={provider.avgRating || 5.0} count={provider.reviewCount || 1} size="md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Services Offered */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Services Offered & Pricing</h2>

          <div className="space-y-3">
            {provider.services?.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {item.service?.category?.name}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{item.service?.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.service?.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 pl-4">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">${Number(item.price).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">Fixed rate</p>
                  </div>
                  <button
                    onClick={() => handleBookService(item)}
                    className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Customer Reviews</h2>

          {provider.recentReviews?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              No written reviews yet. Be the first to book and rate!
            </div>
          ) : (
            <div className="space-y-3">
              {provider.recentReviews?.map((rev) => (
                <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{rev.customer?.fullName || 'Customer'}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <StarRating rating={rev.rating} showCount={false} size="sm" />

                  {rev.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookServiceModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          service={selectedService}
          preselectedProvider={{
            providerUserId: provider.userId,
            businessName: provider.businessName,
            serviceArea: provider.serviceArea,
            price: selectedService.basePrice,
          }}
        />
      )}
    </div>
  );
}
