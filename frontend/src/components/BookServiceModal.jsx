import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { api } from '../api/client';
import { Calendar, MapPin, FileText, CheckCircle2, AlertCircle, DollarSign, UserCheck } from 'lucide-react';

export function BookServiceModal({ isOpen, onClose, service, preselectedProvider, onSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [serviceAddress, setServiceAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [customerInstructions, setCustomerInstructions] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      // Default to tomorrow 10am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);

      if (preselectedProvider) {
        setSelectedProviderId(preselectedProvider.providerUserId || preselectedProvider.id);
      } else {
        setSelectedProviderId('');
      }
    }
  }, [isOpen, preselectedProvider]);

  if (!service) return null;

  const currentPrice = preselectedProvider?.price ? preselectedProvider.price : service.basePrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onClose();
      navigate('/login');
      return;
    }

    if (user.role !== 'CUSTOMER') {
      setErrorMsg('Only registered customer accounts can create bookings. Please sign in as a customer.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`);

      const payload = {
        serviceId: service.id,
        providerId: selectedProviderId || undefined,
        serviceAddress,
        scheduledAt: scheduledAt.toISOString(),
        customerInstructions: customerInstructions || undefined,
      };

      const res = await api.post('/orders', payload);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
      navigate('/customer/orders');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Service" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Service summary header */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
              {service.category?.name || 'Service'}
            </p>
            <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Agreed Price</p>
            <p className="text-lg font-extrabold text-emerald-600">${Number(currentPrice).toFixed(2)}</p>
          </div>
        </div>

        {/* Assigned provider or open marketplace request */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Service Provider</label>
          {preselectedProvider ? (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-600" />
                <div>
                  <p className="text-xs font-bold text-sky-900">{preselectedProvider.businessName || preselectedProvider.fullName}</p>
                  <p className="text-[10px] text-sky-700">{preselectedProvider.serviceArea || 'Verified Local Pro'}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-800">${Number(preselectedProvider.price || currentPrice).toFixed(2)}</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 text-slate-700 text-xs">
              <strong>Open Marketplace Request:</strong> Your order will be broadcast to all verified providers offering this service in your area.
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Service Address Snapshot *
          </label>
          <input
            type="text"
            required
            value={serviceAddress}
            onChange={(e) => setServiceAddress(e.target.value)}
            placeholder="e.g. 742 Evergreen Terrace, Apt 4B, Springfield"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Scheduled date & time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Preferred Date *
            </label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time *</label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Special Instructions / Gate Code / Parking
          </label>
          <textarea
            rows={2}
            value={customerInstructions}
            onChange={(e) => setCustomerInstructions(e.target.value)}
            placeholder="Specific instructions for the technician upon arrival..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Action buttons */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting Booking...' : 'Confirm & Request Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
