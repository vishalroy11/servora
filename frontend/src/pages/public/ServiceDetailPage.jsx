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
  Tag,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

export function ServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Booking modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    async function loadService() {
      setLoading(true);
      try {
        const res = await api.get(`/services/${id}`);
        if (res.success) {
          setService(res.data);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Service not found');
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [id]);

  const handleBookProvider = (prov) => {
    setSelectedProvider(prov);
    setModalOpen(true);
  };

  const handleBookOpen = () => {
    setSelectedProvider(null);
    setModalOpen(true);
  };

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading service details...</div>;
  }

  if (errorMsg || !service) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Service Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'The requested service does not exist.'}</p>
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
        <ArrowLeft className="w-4 h-4" /> All Services
      </Link>

      {/* Main Service Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Tag className="w-3.5 h-3.5" />
            {service.category?.name}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{service.name}</h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            {service.description || 'Experienced professional service tailored to your home and commercial requirements.'}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" /> Verified Quality Guarantee
            </span>
            <span>·</span>
            <span>{service.providers?.length || 0} providers offering this service</span>
          </div>
        </div>

        {/* Base Price Card */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shrink-0 sm:w-72 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Platform Base Catalog Price</p>
            <p className="text-3xl font-black text-slate-900 mt-1">${Number(service.basePrice).toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Providers set individual pricing based on options and materials.</p>
          </div>

          <button
            onClick={handleBookOpen}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Book Open Request
          </button>
        </div>
      </div>

      {/* Providers Offering This Service */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Approved Providers Offering This Service</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose a specific verified professional to handle your job or schedule an open marketplace request above.
          </p>
        </div>

        {service.providers?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No specific providers have listed custom pricing for this service yet. You can still create an open booking request!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.providers?.map((prov) => (
              <div
                key={prov.providerServiceId}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{prov.businessName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {prov.serviceArea || 'Local Area'}
                      </p>
                    </div>
                    <span className="text-base font-black text-emerald-600">${Number(prov.price).toFixed(2)}</span>
                  </div>

                  <div className="mt-3">
                    <StarRating rating={prov.avgRating || 5.0} count={prov.reviewCount || 1} size="sm" />
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {prov.bio || 'Licensed and insured local specialist.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    to={`/providers/${prov.providerUserId}`}
                    className="flex-1 py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    View Reviews
                  </Link>
                  <button
                    onClick={() => handleBookProvider(prov)}
                    className="flex-1 py-2 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                  >
                    Book with Pro
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookServiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        service={service}
        preselectedProvider={selectedProvider}
      />
    </div>
  );
}
