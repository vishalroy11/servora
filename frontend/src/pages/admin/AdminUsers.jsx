import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Search, UserCheck, UserX, Shield, User, Wrench } from 'lucide-react';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (searchQuery) params.append('q', searchQuery);
      params.append('pageSize', '50');

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.data.items || []);
      }
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, searchQuery]);

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, {
        isActive: !user.isActive,
      });
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">ADMIN</span>;
    if (role === 'PROVIDER') return <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-[10px] font-bold">PROVIDER</span>;
    return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">CUSTOMER</span>;
  };

  return (
    <DashboardLayout
      title="User Accounts Management"
      subtitle="Inspect registered customers, providers, and administrator accounts across the marketplace."
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by full name or email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['', 'CUSTOMER', 'PROVIDER', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r || 'All Roles'}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading user accounts...</div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">No users found matching query.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Activity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{u.fullName}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                        {u.providerProfile?.businessName && (
                          <p className="text-[10px] text-indigo-600 font-semibold">{u.providerProfile.businessName}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5 px-4 text-slate-500">{u.phone || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {u.orderCount || 0} {u.role === 'PROVIDER' ? 'assignments' : 'orders'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              u.isActive
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
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
