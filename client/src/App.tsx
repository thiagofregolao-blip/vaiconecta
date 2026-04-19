import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPlans from './pages/admin/Plans';
import AdminSessions from './pages/admin/Sessions';
import AdminPayments from './pages/admin/Payments';
import AdminVouchers from './pages/admin/Vouchers';
import AdminStores from './pages/admin/Stores';
import AdminUsers from './pages/admin/Users';
import AdminBanners from './pages/admin/Banners';
import StoreDashboard from './pages/admin/StoreDashboard';
import AdminLayout from './components/admin/Layout';

// Painel do lojista
import LojistaLayout from './components/lojista/Layout';
import LojistaOverview from './pages/lojista/Overview';
import LojistaProducts from './pages/lojista/Products';
import LojistaImport from './pages/lojista/Import';
import LojistaBranding from './pages/lojista/Branding';
import LojistaSubscription from './pages/lojista/Subscription';

// Vitrine pública
import StorePage from './pages/public/StorePage';
import ProductPage from './pages/public/ProductPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('vc_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('vc_token');
  const role = localStorage.getItem('vc_role');
  if (!token) return <Navigate to="/admin/login" replace />;
  if (role !== 'SUPER_ADMIN') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function RequireLojista({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('vc_token');
  const role = localStorage.getItem('vc_role');
  if (!token) return <Navigate to="/admin/login" replace />;
  // Super admin também pode entrar no painel de lojista (via x-as-store)
  if (role !== 'STORE_ADMIN' && role !== 'SUPER_ADMIN') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home híbrida (Wi-Fi + vitrine de lojas) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal" element={<LandingPage />} />

        {/* Vitrine pública das lojas */}
        <Route path="/loja/:slug" element={<StorePage />} />
        <Route path="/loja/:slug/produto/:id" element={<ProductPage />} />

        {/* Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Legado: acesso direto ao dashboard da loja antigo */}
        <Route path="/admin/store/:storeId" element={
          <RequireAuth><StoreDashboard /></RequireAuth>
        } />

        {/* Painel do Lojista (novo) */}
        <Route path="/lojista" element={
          <RequireLojista><LojistaLayout /></RequireLojista>
        }>
          <Route index element={<LojistaOverview />} />
          <Route path="produtos" element={<LojistaProducts />} />
          <Route path="importar" element={<LojistaImport />} />
          <Route path="branding" element={<LojistaBranding />} />
          <Route path="assinatura" element={<LojistaSubscription />} />
        </Route>

        {/* Super admin */}
        <Route path="/admin" element={
          <RequireSuperAdmin><AdminLayout /></RequireSuperAdmin>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="vouchers" element={<AdminVouchers />} />
          <Route path="banners" element={<AdminBanners />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
