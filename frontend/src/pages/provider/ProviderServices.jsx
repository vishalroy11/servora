import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, DollarSign } from 'lucide-react';

export function ProviderServices() {
  const [providerServices, setProviderServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Service Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Edit Price Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const loadServices = async () => {
    setLoading(true);
    try {
      const [psRes, sRes] = await Promise.all([
        api.get('/provider/services'),
        api.get('/services?pageSize=100'),
      ]);
      if (psRes.success) setProviderServices(psRes.data);
      if (sRes.success) setAllServices(sRes.data.items || []);
    } catch (e) {
      console.error('Failed to load provider services', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const offeredServiceIds = new Set(providerServices.map((ps) => ps.serviceId));
  const availableToAdd = allServices.filter((s) => !offeredServiceIds.has(s.id));

  const handleOpenAdd = () => {
    if (availableToAdd.length > 0) {
      setSelectedServiceId(availableToAdd[0].id);
      setCustomPrice(availableToAdd[0].basePrice.toString());
    } else {
      setSelectedServiceId('');
      setCustomPrice('');
    }
    setAddModalOpen(true);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      await api.post('/provider/services', {
        serviceId: selectedServiceId,
        price: Number(customPrice),
      });
      setAddModalOpen(false);
      await loadServices();
    } catch (err) {
      alert(err.message || 'Failed to add service offering');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditPrice(item.price.toString());
    setEditModalOpen(true);
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      await api.put(`/provider/services/${editingItem.id}`, {
        price: Number(editPrice),
      });
      setEditModalOpen(false);
      await loadServices();
    } catch (err) {
      alert(err.message || 'Failed to update service pricing');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await api.put(`/provider/services/${item.id}`, {
        isActive: !item.isActive,
      });
      await loadServices();
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Are you sure you wish to remove this service from your offerings?')) return;
    try {
      await api.delete(`/provider/services/${id}`);
      await loadServices();
    } catch (err) {
      alert(err.message || 'Failed to delete service offering');
    }
  };

  return (
    <DashboardLayout
      title="Services & Custom Pricing Management"
      subtitle="Define which marketplace services you offer and set individual custom prices."
      actions={
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Service Offering
        </button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading your offerings...</div>
          ) : providerServices.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-3">
              <Tag className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">No Services Offered Yet</h3>
              <p className="text-slate-400">Add services from our catalog to start receiving incoming booking requests.</p>
              <button
                onClick={handleOpenAdd}
                className="mt-2 text-indigo-600 font-semibold hover:underline"
              >
                + Add your first service
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Catalog Base Price</th>
                    <th className="py-3 px-4">Your Custom Rate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {providerServices.map((ps) => (
                    <tr key={ps.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{ps.service?.name}</td>
                      <td className="py-3.5 px-4 text-indigo-600 font-semibold">{ps.service?.category?.name}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        ${Number(ps.service?.basePrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 text-sm">
                        ${Number(ps.price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(ps)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            ps.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {ps.isActive ? 'Active Listing' : 'Paused'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(ps)}
                          className="p-1 text-slate-500 hover:text-indigo-600"
                          title="Change Price"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(ps.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Remove Offering"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Service Offering">
        <form onSubmit={handleAddService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Service from Catalog</label>
            <select
              value={selectedServiceId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedServiceId(id);
                const s = allServices.find((x) => x.id === id);
                if (s) setCustomPrice(s.basePrice.toString());
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableToAdd.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.category?.name} — {s.name} (Base: ${Number(s.basePrice).toFixed(0)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Custom Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">This agreed price will be snapshot whenever a customer selects you.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              {modalSubmitting ? 'Adding...' : 'Add Offering'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Price Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Custom Price">
        <form onSubmit={handleUpdatePrice} className="space-y-4">
          <p className="text-xs text-slate-600">
            Updating price for <strong>{editingItem?.service?.name}</strong>:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Custom Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              {modalSubmitting ? 'Updating...' : 'Save Price'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
