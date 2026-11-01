import { Link } from 'react-router-dom';
import { Sparkles, Shield, Clock, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">Servora</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The premier centralized marketplace connecting homeowners and businesses with verified, top-rated local service professionals.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-indigo-400" /> Verified Pros</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Real-time Tracking</span>
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/services?category=Home%20Cleaning" className="hover:text-white transition-colors">Home Cleaning</Link></li>
              <li><Link to="/services?category=Plumbing" className="hover:text-white transition-colors">Plumbing Repairs</Link></li>
              <li><Link to="/services?category=Electrical%20Repairs" className="hover:text-white transition-colors">Electrical Repairs</Link></li>
              <li><Link to="/services?category=Computer%20Repair" className="hover:text-white transition-colors">Computer Diagnostics</Link></li>
              <li><Link to="/services?category=Handyman%20Services" className="hover:text-white transition-colors">Handyman & Furniture</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/login" className="hover:text-white transition-colors">Customer Portal</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register as Provider</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Provider Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Admin Console</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Platform Architecture</Link></li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/contact" className="hover:text-white transition-colors">Help Center & Support</Link></li>
              <li><span className="text-slate-500">PostgreSQL Powered Engine</span></li>
              <li><span className="text-slate-500">Atomic Concurrency Locks</span></li>
              <li><span className="text-slate-500">Privacy & Order Audit Trail</span></li>
            </ul>
            <p className="mt-4 text-[11px] text-slate-500 flex items-center gap-1">
              Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for full-stack excellence.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Servora Marketplace Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
