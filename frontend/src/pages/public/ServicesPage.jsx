import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { BookServiceModal } from '../../components/BookServiceModal';
import { Search, Filter, Tag, ArrowRight, Calendar } from 'lucide-react';

export function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/categories');
        if (res.success) setCategories(res.data);
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        // Find category ID if selected
        let catId = undefined;
        if (selectedCategory) {
          const match = categories.find((c) => c.name === selectedCategory || c.id === selectedCategory);
          if (match) catId = match.id;
        }

        const params = new URLSearchParams();
        if (catId) params.append('categoryId', catId);
        if (searchQuery) params.append('q', searchQuery);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);

        const res = await api.get(`/services?${params.toString()}`);
        if (res.success) {
          setServices(res.data.items);
        }
      } catch (e) {
        console.error('Failed to fetch services', e);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [selectedCategory, searchQuery, minPrice, maxPrice, categories]);

  const handleCategoryClick = (catName) => {
    const next = selectedCategory === catName ? '' : catName;
    setSelectedCategory(next);
    const newParams = new URLSearchParams(searchParams);
    if (next) {
      newParams.set('category', next);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const openBooking = (service) => {
    setSelectedServiceToBook(service);
    setBookingModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Services Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore all available services, compare certified provider offerings, and book instantly.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services by keyword or description..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min Price ($)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max Price ($)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => handleCategoryClick('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading catalog offerings...</div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Tag className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No services match your criteria</h3>
          <p className="text-xs text-slate-500">Try clearing filters or searching with another term.</p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearchQuery('');
              setMinPrice('');
              setMaxPrice('');
            }}
            className="text-xs text-indigo-600 font-semibold hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {service.category?.name}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    ${Number(service.basePrice).toFixed(2)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1">{service.name}</h3>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {service.description || 'Professional and reliable local service guaranteed.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                <Link
                  to={`/services/${service.id}`}
                  className="flex-1 text-center py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  View Providers
                </Link>
                <button
                  onClick={() => openBooking(service)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookServiceModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        service={selectedServiceToBook}
      />
    </div>
  );
}
