import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Star,
  User,
  Inbox,
  Clock,
  FileText,
  Tag,
  UserCheck,
  Users,
  ShieldCheck,
  FolderTree,
  Wrench,
  ShoppingBag,
  BarChart3,
  LogOut,
  Search,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export function DashboardLayout({ children, title, subtitle, actions }) {
  const { user, logout, isAdmin, isProvider, isCustomer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const customerNav = [
    { label: 'Overview', path: '/customer', icon: LayoutDashboard },
    { label: 'Browse Services', path: '/services', icon: Search },
    { label: 'My Bookings', path: '/customer/orders', icon: CalendarCheck },
    { label: 'My Reviews', path: '/customer/reviews', icon: Star },
    { label: 'Profile Settings', path: '/customer/profile', icon: User },
  ];

  const providerNav = [
    { label: 'Overview', path: '/provider', icon: LayoutDashboard },
    { label: 'Incoming Requests', path: '/provider/incoming', icon: Inbox },
    { label: 'Active Jobs', path: '/provider/active', icon: Clock },
    { label: 'Job History', path: '/provider/history', icon: FileText },
    { label: 'Services & Pricing', path: '/provider/services', icon: Tag },
    { label: 'Customer Reviews', path: '/provider/reviews', icon: Star },
    { label: 'Profile Settings', path: '/provider/profile', icon: UserCheck },
  ];

  const adminNav = [
    { label: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Users Management', path: '/admin/users', icon: Users },
    { label: 'Provider Approvals', path: '/admin/providers', icon: ShieldCheck },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Services Catalog', path: '/admin/services', icon: Wrench },
    { label: 'All Orders & Audit', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Review Moderation', path: '/admin/reviews', icon: Star },
    { label: 'Analytics Reports', path: '/admin/reports', icon: BarChart3 },
  ];

  let navItems = customerNav;
  let roleTitle = 'Customer Portal';
  let badgeColor = 'bg-emerald-100 text-emerald-800';

  if (isAdmin) {
    navItems = adminNav;
    roleTitle = 'Admin Management Console';
    badgeColor = 'bg-purple-100 text-purple-800';
  } else if (isProvider) {
    navItems = providerNav;
    roleTitle = 'Service Provider Hub';
    badgeColor = 'bg-sky-100 text-sky-800';
  }

  const renderNavLinks = () => (
    <ul className="space-y-1.5 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Servora</span>
            </Link>

            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className={`hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
              {roleTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public Marketplace
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <p className="font-bold text-slate-800">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
          </div>
          <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
          <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
            PostgreSQL Real-time Engine
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">{roleTitle}</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {(title || actions) && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                {title && <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>}
                {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
