import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Wifi, Clock, Monitor } from 'lucide-react';
import { adminApi } from '../../api';

interface Session {
  '.id': string;
  user: string;
  address: string;
  'mac-address': string;
  uptime: string;
  server: string;
}

export default function AdminSessions() {
  const { data: sessions = [], isLoading, refetch, isFetching } = useQuery<Session[]>({
    queryKey: ['admin-sessions'],
    queryFn: () => adminApi.get('/sessions/active').then((r) => r.data),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Sessões Ativas</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {sessions.length} conexão{sessions.length !== 1 ? 'ões' : ''} ativa{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 glass px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <Wifi className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma sessão ativa no momento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Usuário / MAC
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                    IP
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Servidor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map((s) => (
                  <tr key={s['.id']} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                          <Monitor className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{s.user}</p>
                          <p className="text-slate-500 text-xs font-mono">{s['mac-address']}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-slate-300 text-sm font-mono">{s.address}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {s.uptime}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-slate-400 text-sm">{s.server}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
