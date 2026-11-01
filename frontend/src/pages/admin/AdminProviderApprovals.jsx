import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, MapPin } from 'lucide-react';

export function AdminProviderApprovals() {
  const [providers, setProviders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/admin/providers${query}`);
      if (res.success) {
        setProviders(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load providers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, [statusFilter]);

  const handleUpdateStatus = async (providerId, newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/providers/${providerId}/status`, {
        status: newStatus,
      });
      await loadProviders();
    } catch (err) {
      alert(err.message || 'Failed to update provider status');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { label: 'All Providers', value: '' },
    { label: 'Pending Approvals', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Suspended', value: 'SUSPENDED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <DashboardLayout
      title="Service Provider Verification Queue"
      subtitle="Review provider business applications, assess credentials, and manage marketplace operating status."
    >
      <div className="space-y-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading providers queue...</div>
          ) : providers.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">No provider profiles match this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Business & Owner</th>
                    <th className="py-3 px-4">Service Area & Bio</th>
                    <th className="py-3 px-4">Offered Services</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{p.businessName}</p>
                        <p className="text-xs text-slate-600">{p.user?.fullName}</p>
                        <p className="text-[10px] text-slate-400">{p.user?.email}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {p.serviceArea || 'Local Zone'}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{p.bio || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.providerServices?.length > 0 ? (
                            p.providerServices.map((ps) => (
                              <span key={ps.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                {ps.service?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">None listed</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.verificationStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {p.verificationStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                              disabled={actionLoading}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'REJECTED')}
                              disabled={actionLoading}
                              className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {p.verificationStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'SUSPENDED')}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs hover:bg-slate-200"
                          >
                            Suspend
                          </button>
                        )}

                        {['SUSPENDED', 'REJECTED'].includes(p.verificationStatus) && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs hover:bg-emerald-100"
                          >
                            Reactivate
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
