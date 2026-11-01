import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ServicesPage } from './pages/public/ServicesPage';
import { ServiceDetailPage } from './pages/public/ServiceDetailPage';
import { ProviderProfilePage } from './pages/public/ProviderProfilePage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';

// Customer Pages
import { CustomerOverview } from './pages/customer/CustomerOverview';
import { CustomerOrders } from './pages/customer/CustomerOrders';
import { CustomerOrderDetail } from './pages/customer/CustomerOrderDetail';
import { CustomerReviews } from './pages/customer/CustomerReviews';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Provider Pages
import { ProviderOverview } from './pages/provider/ProviderOverview';
import { IncomingRequests } from './pages/provider/IncomingRequests';
import { ProviderActiveOrders } from './pages/provider/ProviderActiveOrders';
import { ProviderOrderHistory } from './pages/provider/ProviderOrderHistory';
import { ProviderServices } from './pages/provider/ProviderServices';
import { ProviderReviews } from './pages/provider/ProviderReviews';
import { ProviderProfile } from './pages/provider/ProviderProfile';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminProviderApprovals } from './pages/admin/AdminProviderApprovals';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminServices } from './pages/admin/AdminServices';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminReports } from './pages/admin/AdminReports';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400 bg-slate-50">
        Authenticating session credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'PROVIDER') return <Navigate to="/provider" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
          <Route path="/services/:id" element={<PublicLayout><ServiceDetailPage /></PublicLayout>} />
          <Route path="/providers/:id" element={<PublicLayout><ProviderProfilePage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

          {/* Customer Portal */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/reviews"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />

          {/* Provider Portal */}
          <Route
            path="/provider"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <ProviderOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/incoming"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <IncomingRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/active"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <ProviderActiveOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/history"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <ProviderOrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/services"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <ProviderServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/reviews"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <ProviderReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/profile"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <ProviderProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/providers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminProviderApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
