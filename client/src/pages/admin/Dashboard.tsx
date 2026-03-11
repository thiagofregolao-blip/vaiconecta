import { useQuery } from '@tanstack/react-query';
import { Activity, DollarSign, Package, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api';
import StatCard from '../../components/admin/StatCard';

interface Stats {
  totalAtivos: number;
  totalHoje: number;
  receitaHoje: number;
  totalPlanos: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.get('/sessions/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: mikrotik } = useQuery<{ online: boolean }>({
    queryKey: ['mikrotik-status'],
    queryFn: () => adminApi.get('/sessions/mikrotik/status').then((r) => r.data),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Visão geral do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
              mikrotik?.online
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {mikrotik?.online ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                MikroTik Online
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                MikroTik Offline
              </>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sessões ativas"
          value={stats?.totalAtivos ?? 0}
          icon={Activity}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title="Vendas hoje"
          value={stats?.totalHoje ?? 0}
          icon={Package}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          title="Receita hoje"
          value={`R$ ${(stats?.receitaHoje ?? 0).toFixed(2).replace('.', ',')}`}
          icon={DollarSign}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title="Planos ativos"
          value={stats?.totalPlanos ?? 0}
          icon={Package}
          color="purple"
          loading={isLoading}
        />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            Infraestrutura
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway</span>
              <span className="text-white font-medium">MikroTik CCR2004</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Access Points</span>
              <span className="text-white font-medium">18x Ubiquiti U7 Pro</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Padrão Wi-Fi</span>
              <span className="text-white font-medium">Wi-Fi 7</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status MikroTik</span>
              <span className={`font-medium ${mikrotik?.online ? 'text-green-400' : 'text-red-400'}`}>
                {mikrotik?.online ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Como funciona
          </h3>
          <ol className="space-y-2 text-sm text-slate-400">
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold shrink-0">1.</span>
              Cliente conecta no Wi-Fi ou acessa o site
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold shrink-0">2.</span>
              Escolhe um plano e paga via Pix
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold shrink-0">3.</span>
              MikroTik libera o MAC automaticamente
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold shrink-0">4.</span>
              Acesso expira após o tempo do plano
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
