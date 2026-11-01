import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

export function OrderTimeline({ status, events = [], createdAt, acceptedAt, startedAt, completedAt, cancelledAt }) {
  const steps = [
    { key: 'PENDING', label: 'Order Created', date: createdAt },
    { key: 'ACCEPTED', label: 'Provider Accepted', date: acceptedAt },
    { key: 'IN_PROGRESS', label: 'Service Started', date: startedAt },
    { key: 'COMPLETED', label: 'Service Completed', date: completedAt },
  ];

  if (status === 'CANCELLED') {
    steps.push({ key: 'CANCELLED', label: 'Order Cancelled', date: cancelledAt });
  }

  const getStepState = (stepKey, index) => {
    if (status === 'CANCELLED') {
      if (stepKey === 'CANCELLED') return 'cancelled';
      if (stepKey === 'PENDING') return 'completed';
      return 'skipped';
    }

    const orderStatusOrder = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
    const currentIndex = orderStatusOrder.indexOf(status);

    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="py-4">
      <div className="relative">
        <div className="hidden sm:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {steps.slice(0, 4).map((step, idx) => {
            const state = getStepState(step.key, idx);

            return (
              <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                <div className="relative z-10 flex items-center justify-center">
                  {state === 'completed' ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : state === 'current' ? (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-indigo-100 shadow-xs animate-pulse">
                      <Clock className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center">
                      <Circle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div>
                  <p className={`text-xs font-semibold ${
                    state === 'current' ? 'text-indigo-600' : state === 'completed' ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(step.date).toLocaleDateString()} {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {status === 'CANCELLED' && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>This order was cancelled on {cancelledAt ? new Date(cancelledAt).toLocaleString() : 'recently'}.</span>
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Audit History</h4>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="text-xs flex items-start justify-between py-1 border-b border-slate-100 last:border-0">
                <div>
                  <span className="font-medium text-slate-800">{ev.eventType.replace(/_/g, ' ')}</span>
                  {ev.note && <span className="text-slate-500 ml-2">— {ev.note}</span>}
                </div>
                <span className="text-slate-400 shrink-0 text-[11px] ml-4">
                  {new Date(ev.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
