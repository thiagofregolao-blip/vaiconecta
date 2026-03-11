import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '../../api';

interface Payment {
  id: string;
  email: string;
  macAddress: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  plan: { name: string; hours: number };
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  APPROVED: { label: 'Aprovado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ACTIVE: { label: 'Ativo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  EXPIRED: { label: 'Expirado', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, status],
    queryFn: () =>
      adminApi
        .get('/sessions/payments', { params: { page, limit: 20, ...(status && { status }) } })
        .then((r) => r.data),
  });

  const payments: Payment[] = data?.payments ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Pagamentos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} registro{total !== 1 ? 's' : ''}</p>
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">Todos os status</option>
          {Object.entries(statusMap).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Plano</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => {
                  const s = statusMap[p.status] ?? statusMap.CANCELLED;
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{p.email}</p>
                        <p className="text-slate-500 text-xs font-mono">{p.macAddress}</p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-slate-300 text-sm">{p.plan.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-slate-400 text-xs">
                          {new Date(p.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
