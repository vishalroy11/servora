import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';
import { Wrench, Plus, Edit2, Tag } from 'lucide-react';

export function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Service Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Edit Service Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/categories'),
      ]);
      if (srvRes.success) setServices(srvRes.data || []);
      if (catRes.success) {
        setCategories(catRes.data || []);
        if (catRes.data?.length > 0) setCategoryId(catRes.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load services', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      await api.post('/admin/services', {
        categoryId,
        name,
        description,
        basePrice: Number(basePrice),
      });
      setAddModalOpen(false);
      setName('');
      setDescription('');
      setBasePrice('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create service');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setEditName(srv.name);
    setEditDescription(srv.description || '');
    setEditBasePrice(srv.basePrice.toString());
    setEditCategoryId(srv.categoryId);
    setEditModalOpen(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    try {
      await api.patch(`/admin/services/${editingService.id}`, {
        name: editName,
        description: editDescription,
        basePrice: Number(editBasePrice),
        categoryId: editCategoryId,
      });
      setEditModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update service');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleActive = async (srv) => {
    try {
      await api.patch(`/admin/services/${srv.id}`, {
        isActive: !srv.isActive,
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to toggle service status');
    }
  };

  return (
    <DashboardLayout
      title="Master Services Catalog"
      subtitle="Configure standard marketplace services, establish base rates, and monitor provider adoption."
      actions={
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Master Service
        </button>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading catalog services...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Catalog Base Price</th>
                    <th className="py-3 px-4">Providers Offering</th>
                    <th className="py-3 px-4">Total Orders</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{srv.name}</td>
                      <td className="py-3.5 px-4 text-indigo-600 font-semibold">{srv.category?.name}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ${Number(srv.basePrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{srv.providerCount || 0} pros</td>
                      <td className="py-3.5 px-4 text-slate-600">{srv.orderCount || 0} orders</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(srv)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            srv.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {srv.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(srv)}
                          className="p-1 text-slate-500 hover:text-indigo-600"
                          title="Edit Service"
                        >
                          <Edit2 className="w-4 h-4" />
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

      {/* Add Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Create Master Service">
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tankless Water Heater Inspection"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="100.00"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of deliverables included in this service..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              {modalSubmitting ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Master Service">
        <form onSubmit={handleUpdateService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={editBasePrice}
              onChange={(e) => setEditBasePrice(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Existing historical orders will preserve their booked agreed prices.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
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
              {modalSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
