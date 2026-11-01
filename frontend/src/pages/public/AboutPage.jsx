import { ShieldCheck, Database, Lock, Star, Sparkles, CheckCircle2 } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Servora Architecture & Vision
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Engineered for Trust, Precision, and Real-World Reliability
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Servora is a complete full-stack marketplace connecting customers with verified service professionals. Built from the ground up with clean REST architecture and real PostgreSQL database guarantees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 w-fit">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Atomic Order Concurrency</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Multi-provider marketplaces suffer from race conditions when two professionals claim the same customer order. Servora implements database transaction isolation with atomic conditional updates, preventing duplicate acceptance and returning deterministic HTTP 409 Conflict protections.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Historical Price Snapshots</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            When an order is created, Servora snapshots the exact service name and agreed price. Even if a provider or administrator subsequently raises catalog rates, historical order receipts, accounting ledger events, and earnings remain immutable and accurate.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Cryptographically Enforced Reviews</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unverified reviews undermine marketplace integrity. On Servora, ratings (1 to 5 stars) can only be submitted by the exact customer linked to an order, strictly after the order has transitioned to COMPLETED status, with a unique constraint preventing duplicate submissions.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Three-Tiered Role Isolation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Customers, Service Providers, and Administrators each experience tailored portals with server-side authorization middleware. Customers cannot read another customer's orders, unapproved providers cannot accept jobs, and administrative accounts are protected against public registration.
          </p>
        </div>
      </div>
    </div>
  );
}
