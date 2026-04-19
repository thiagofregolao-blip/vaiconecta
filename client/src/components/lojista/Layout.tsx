import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, Upload, Palette, Sparkles, LogOut,
  Menu, X, Store, ExternalLink,
} from 'lucide-react';
import { lojistaApi } from '../../api';

const nav = [
  { to: '/lojista', icon: LayoutDashboard, label: 'Visão Geral', end: true },
  { to: '/lojista/produtos', icon: Package, label: 'Meus Produtos' },
  { to: '/lojista/importar', icon: Upload, label: 'Importar' },
  { to: '/lojista/branding', icon: Palette, label: 'Identidade' },
  { to: '/lojista/assinatura', icon: Sparkles, label: 'Assinatura' },
];

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  themeColor: string | null;
  isPremium: boolean;
  subscriptionStatus: string;
}

export default function LojistaLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: store } = useQuery<StoreInfo>({
    queryKey: ['lojista-store'],
    queryFn: () => lojistaApi.get('/store').then(r => r.data),
    staleTime: 60_000,
  });

  function logout() {
    localStorage.clear();
    navigate('/admin/login');
  }

  const themeColor = store?.themeColor || '#f97316';

  return (
    <div
      className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex"
      style={{ ['--brand' as string]: themeColor } as React.CSSProperties}
    >
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-40 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header com branding da loja */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
            >
              {store?.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm leading-tight truncate">
                {store?.name || 'Minha Loja'}
              </p>
              <p className="text-slate-500 text-xs">Painel do Lojista</p>
            </div>
          </div>

          {store?.isPremium && (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 w-fit">
              <Sparkles className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }: any) =>
                isActive
                  ? {
                      background: `linear-gradient(90deg, ${themeColor}26, ${themeColor}0f)`,
                      borderLeft: `3px solid ${themeColor}`,
                      paddingLeft: '13px',
                    }
                  : {}
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: link pra vitrine pública + logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
          {store?.slug && (
            <a
              href={`/loja/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium"
            >
              <ExternalLink className="w-[18px] h-[18px]" />
              Ver minha vitrine
            </a>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-medium w-full cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: themeColor }}
            >
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm truncate">
              {store?.name || 'Minha Loja'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
