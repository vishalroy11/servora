import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { StarRating } from '../../components/StarRating';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Wrench,
  Home,
  Zap,
  Cpu,
  Scissors,
  GraduationCap,
  Dog,
  Trees,
} from 'lucide-react';

export function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, provsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/providers'),
        ]);
        if (catsRes.success) setCategories(catsRes.data);
        if (provsRes.success) setFeaturedProviders(provsRes.data.slice(0, 3));
      } catch (e) {
        console.error('Failed to load home data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/services');
    }
  };

  const categoryIcons = {
    'Home Cleaning': Home,
    'Plumbing': Wrench,
    'Electrical Repairs': Zap,
    'Appliance Repair': Wrench,
    'Beauty Services': Scissors,
    'Lawn Mowing': Trees,
    'Tutoring': GraduationCap,
    'Computer Repair': Cpu,
    'Handyman Services': Wrench,
    'Pet Care': Dog,
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b12_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b12_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Verified Professionals · Real-time PostgreSQL Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Book Trusted Local Pros for Any Home or Tech Service
          </h1>

          <p className="text-base sm:text-lg text-indigo-200 max-w-2xl mx-auto font-normal">
            From deep house cleaning and plumbing repairs to custom PC diagnostics and lawn maintenance. Instant booking, transparent pricing, and tracked completion.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl shadow-2xl border border-slate-200">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 'cleaning', 'plumbing', 'faucet', 'laptop'..."
                  className="w-full text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none py-2"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30"
              >
                Search Services
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-xs text-indigo-300 mr-1">Popular:</span>
            {['Home Cleaning', 'Plumbing', 'Electrical Repairs', 'Computer Repair'].map((cat) => (
              <Link
                key={cat}
                to={`/services?category=${encodeURIComponent(cat)}`}
                className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Vetted & Approved Providers</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Every service professional submits background and license information reviewed by administrators.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Real-time Order Lifecycle</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Track full state transitions: Created → Accepted → Started → Completed with concurrency conflict locks.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Authentic Verified Reviews</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ratings (1-5 stars) and feedback can only be submitted by the verified customer after order completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Explore Service Categories</h2>
            <p className="text-xs text-slate-500 mt-1">Browse all available professional categories across your region.</p>
          </div>
          <Link to="/services" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.name] || Wrench;
            return (
              <Link
                key={cat.id}
                to={`/services?category=${encodeURIComponent(cat.name)}`}
                className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center text-center"
              >
                <div className="p-3.5 rounded-2xl bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 mt-1">
                  {cat.serviceCount || 0} services
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Providers Spotlight */}
      {featuredProviders.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Top-Rated Service Providers</h2>
              <p className="text-xs text-slate-500 mt-1">Highly rated local specialists with proven customer satisfaction.</p>
            </div>
            <Link to="/services" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Find Providers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProviders.map((prov) => (
              <div key={prov.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{prov.businessName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{prov.serviceArea || 'Local Service'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  </div>

                  <div className="mt-3">
                    <StarRating rating={prov.avgRating || 5.0} count={prov.reviewCount || 1} size="sm" />
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {prov.bio || 'Experienced certified local technician ready to handle your repair and maintenance needs.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {prov.services?.slice(0, 3).map((s) => (
                      <span key={s.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {s.service?.name} (${Number(s.price).toFixed(0)})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100">
                  <Link
                    to={`/providers/${prov.userId}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    View Profile & Offered Services
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it Works */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How Servora Works</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            A seamless three-step journey ensuring peace of mind for both customers and service providers.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 shadow-md shadow-indigo-600/20">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">Search & Pick Provider</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore our transparent catalog, review custom provider prices, and schedule your appointment with address snapshotting.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 shadow-md shadow-indigo-600/20">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">Accepted & Real-time Tracked</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Approved providers accept incoming bookings with concurrency protection. Follow the live stepper timeline as work begins.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 shadow-md shadow-indigo-600/20">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-2">Confirm & Rate Quality</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upon completion, verify the finished work and submit an authentic 1-5 star review calculating the provider's platform standing.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold max-w-xl mx-auto">
            Are You a Skilled Service Professional?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto leading-relaxed">
            Expand your customer base, manage your custom pricing, receive incoming local bookings, and build a verified reputation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-md transition-all"
            >
              Register as Service Provider
            </Link>
            <Link
              to="/services"
              className="px-6 py-3 rounded-xl bg-indigo-900/50 hover:bg-indigo-900 text-white font-semibold text-xs border border-indigo-400/30 transition-all"
            >
              Browse Public Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
