import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Activity, CreditCard, Tag, LogOut, Wifi, Menu, X, Users, Store, Image } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/plans', icon: Package, label: 'Planos' },
  { to: '/admin/stores', icon: Store, label: 'Lojas' },
  { to: '/admin/users', icon: Users, label: 'Usuários' },
  { to: '/admin/sessions', icon: Activity, label: 'Sessões' },
  { to: '/admin/payments', icon: CreditCard, label: 'Pagamentos' },
  { to: '/admin/vouchers', icon: Tag, label: 'Vouchers' },
  { to: '/admin/banners', icon: Image, label: 'Banners' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const name = localStorage.getItem('vc_name') || 'Admin';

  function logout() { localStorage.clear(); navigate('/admin/login'); }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 z-40 glass-dark flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-bold leading-none">VaiConecta</p>
            <p className="text-slate-500 text-xs">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <p className="px-4 text-xs text-slate-600 mb-2 truncate">{name}</p>
          <button onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium w-full cursor-pointer">
            <LogOut className="w-[18px] h-[18px]" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 glass-dark">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold text-sm">VaiConecta</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
