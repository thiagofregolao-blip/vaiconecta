import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, Wifi, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { adminApi } from '../../api';
import StatCard from '../../components/admin/StatCard';

interface StoreDashboardData {
  store: { id: string; name: string; commissionPct: number };
  accessPoints: { id: string; name: string; apMac: string | null }[];
  stats: {
    totalHoje: number;
    totalMes: number;
    receitaTotal: number;
    receitaMes: number;
    comissaoTotal: number;
    comissaoMes: number;
  };
  pagamentosRecentes: {
    id: string;
    email: string;
    macAddress: string;
    createdAt: string;
    plan: { name: string; price: number };
  }[];
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendente',  color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  APPROVED:  { label: 'Aprovado',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ACTIVE:    { label: 'Ativo',     color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  EXPIRED:   { label: 'Expirado',  color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function StoreDashboard() {
  const { storeId } = useParams<{ storeId: string }>();
  const storeName = localStorage.getItem('vc_store') ? JSON.parse(localStorage.getItem('vc_store')!).name : 'Minha Loja';

  const { data, isLoading, refetch, isFetching } = useQuery<StoreDashboardData>({
    queryKey: ['store-dashboard', storeId],
    queryFn: () => adminApi.get(`/stores/${storeId}/dashboard`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">VaiConecta</span>
            </div>
            <h1 className="text-white text-2xl font-bold">{data?.store.name ?? storeName}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Comissão: <span className="text-blue-400 font-semibold">{data?.store.commissionPct ?? '—'}%</span> sobre cada venda
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => refetch()} disabled={isFetching}
              className="flex items-center gap-2 glass px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-colors cursor-pointer disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button onClick={() => { localStorage.clear(); window.location.href = '/admin/login'; }}
              className="glass px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 text-sm transition-colors cursor-pointer">
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Vendas hoje" value={data?.stats.totalHoje ?? 0} icon={Users} color="blue" loading={isLoading} />
          <StatCard title="Vendas este mês" value={data?.stats.totalMes ?? 0} icon={TrendingUp} color="purple" loading={isLoading} />
          <StatCard
            title="Receita total"
            value={`R$ ${(data?.stats.receitaTotal ?? 0).toFixed(2).replace('.', ',')}`}
            icon={DollarSign} color="green" loading={isLoading}
          />
        </div>

        {/* Comissão destaque */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Sua Comissão</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
              <p className="text-slate-400 text-sm mb-1">Comissão este mês</p>
              <p className="text-green-400 text-3xl font-extrabold">
                R$ {(data?.stats.comissaoMes ?? 0).toFixed(2).replace('.', ',')}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Sobre R$ {(data?.stats.receitaMes ?? 0).toFixed(2).replace('.', ',')} em vendas
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
              <p className="text-slate-400 text-sm mb-1">Comissão total acumulada</p>
              <p className="text-blue-400 text-3xl font-extrabold">
                R$ {(data?.stats.comissaoTotal ?? 0).toFixed(2).replace('.', ',')}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Taxa de {data?.store.commissionPct ?? '—'}% sobre cada venda
              </p>
            </div>
          </div>
        </div>

        {/* APs vinculados */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            Access Points vinculados ({data?.accessPoints.length ?? 0})
          </h3>
          {data?.accessPoints.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum AP vinculado. Contate o administrador.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data?.accessPoints.map((ap) => (
                <div key={ap.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white text-sm">{ap.name}</span>
                  {ap.apMac && <span className="text-slate-500 text-xs font-mono">{ap.apMac}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas vendas */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Últimas vendas pelos seus APs</h3>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}</div>
          ) : !data?.pagamentosRecentes.length ? (
            <div className="p-10 text-center text-slate-500">Nenhuma venda registrada pelos seus APs ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Plano</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.pagamentosRecentes.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{p.email}</p>
                        <p className="text-slate-500 text-xs font-mono">{p.macAddress}</p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-slate-300 text-sm">{p.plan.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-white text-sm font-semibold">R$ {p.plan.price.toFixed(2).replace('.', ',')}</p>
                          <p className="text-green-400 text-xs">
                            +R$ {(p.plan.price * ((data?.store.commissionPct ?? 0) / 100)).toFixed(2).replace('.', ',')} comissão
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(p.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
