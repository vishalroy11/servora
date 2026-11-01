export function StatusBadge({ status, size = 'sm' }) {
  const styles = {
    // Order statuses
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    ACCEPTED: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/10',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    DISPUTED: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10',
    // Provider verification statuses
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    SUSPENDED: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/10',
  };

  const labels = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  };

  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';
  const colorClass = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ring-1 ring-inset ${sizeClass} ${colorClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
