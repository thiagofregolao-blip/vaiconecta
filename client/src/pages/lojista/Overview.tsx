import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle2, Star, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { lojistaApi } from '../../api';

interface Stats {
  produtos: { total: number; ativos: number; inativos: number; destaque: number };
  ultimaImport: { createdAt: string; sourceType: string } | null;
}

interface StoreInfo {
  name: string;
  slug: string;
  themeColor: string | null;
  descricao: string | null;
  isPremium: boolean;
  subscriptionStatus: string;
}

export default function LojistaOverview() {
  const { data: stats, isLoading: loadingStats } = useQuery<Stats>({
    queryKey: ['lojista-stats'],
    queryFn: () => lojistaApi.get('/store/stats').then(r => r.data),
  });

  const { data: store } = useQuery<StoreInfo>({
    queryKey: ['lojista-store'],
    queryFn: () => lojistaApi.get('/store').then(r => r.data),
  });

  const theme = store?.themeColor || '#f97316';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 lg:p-8 border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${theme}22 0%, ${theme}0a 40%, transparent 100%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-30 blur-3xl"
          style={{ background: theme }}
        />
        <div className="relative">
          <p className="text-slate-400 text-sm mb-1">Bem-vindo de volta,</p>
          <h1 className="text-white text-3xl lg:text-4xl font-bold tracking-tight">
            {store?.name || 'Minha Loja'}
          </h1>
          {store?.descricao && (
            <p className="text-slate-400 text-sm mt-3 max-w-xl">{store.descricao}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link
              to="/lojista/produtos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: theme }}
            >
              <Package className="w-4 h-4" />
              Gerenciar produtos
            </Link>
            <Link
              to="/lojista/importar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm bg-white/10 border border-white/15 hover:bg-white/15"
            >
              Importar catálogo
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de produtos" value={stats?.produtos.total ?? 0} icon={Package} loading={loadingStats} color={theme} />
        <StatCard label="Ativos na vitrine" value={stats?.produtos.ativos ?? 0} icon={CheckCircle2} loading={loadingStats} color="#22c55e" />
        <StatCard label="Em destaque" value={stats?.produtos.destaque ?? 0} icon={Star} loading={loadingStats} color="#eab308" />
        <StatCard label="Inativos" value={stats?.produtos.inativos ?? 0} icon={Clock} loading={loadingStats} color="#64748b" />
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickAction
          to="/lojista/importar"
          title="Importe com 1 clique"
          desc="Conecte sua API ou envie uma planilha Excel. O sistema converte preços em tempo real."
          color={theme}
        />
        <QuickAction
          to="/lojista/branding"
          title="Dê sua identidade à loja"
          desc="Escolha cores, logo, banner e redes sociais. Sua vitrine fica única."
          color="#8b5cf6"
        />
      </div>

      {/* Última importação */}
      {stats?.ultimaImport && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Último produto adicionado</p>
              <p className="text-slate-400 text-xs">
                {new Date(stats.ultimaImport.createdAt).toLocaleString('pt-BR')} · via {stats.ultimaImport.sourceType}
              </p>
            </div>
          </div>
          <Link to="/lojista/produtos" className="text-sm text-slate-300 hover:text-white">
            Ver produtos →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, loading, color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22`, border: `1px solid ${color}44` }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
      ) : (
        <p className="text-white text-3xl font-bold tracking-tight">{value}</p>
      )}
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </div>
  );
}

function QuickAction({
  to, title, desc, color,
}: { to: string; title: string; desc: string; color: string }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all"
    >
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity"
        style={{ background: color }}
      />
      <div className="relative">
        <h3 className="text-white font-semibold mb-1.5">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        <p className="mt-4 text-sm font-medium flex items-center gap-1" style={{ color }}>
          Abrir
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </p>
      </div>
    </Link>
  );
}
