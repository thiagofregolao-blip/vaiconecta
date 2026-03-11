import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPlans from './pages/admin/Plans';
import AdminSessions from './pages/admin/Sessions';
import AdminPayments from './pages/admin/Payments';
import AdminVouchers from './pages/admin/Vouchers';
import AdminLayout from './components/admin/Layout';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('vc_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="vouchers" element={<AdminVouchers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
