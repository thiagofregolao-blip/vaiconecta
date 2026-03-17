import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Loader2, User, Store } from 'lucide-react';
import { adminApi } from '../../api';

interface AdminUser {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  role: 'SUPER_ADMIN' | 'STORE_ADMIN';
  store: { id: string; name: string } | null;
  createdAt: string;
}

const emptyForm = { username: '', password: '', name: '', email: '', role: 'STORE_ADMIN', storeId: '' };

export default function AdminUsers() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.get('/users').then((r) => r.data),
  });

  const { data: stores = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['admin-stores-select'],
    queryFn: () => adminApi.get('/stores').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.post('/users', {
      ...form,
      email: form.email || undefined,
      storeId: form.role === 'STORE_ADMIN' ? form.storeId : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowModal(false); setForm(emptyForm); setError(''); },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar usuário'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Usuários</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie admins do sistema e lojistas</p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(emptyForm); setError(''); }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm cursor-pointer">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
          ))}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Perfil</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Loja</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${u.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 border-purple-500/30' : 'bg-blue-500/20 border-blue-500/30'}`}>
                          <User className={`w-4 h-4 ${u.role === 'SUPER_ADMIN' ? 'text-purple-400' : 'text-blue-400'}`} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{u.username}</p>
                          {u.name && <p className="text-slate-500 text-xs">{u.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${u.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                        {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Lojista'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      {u.store ? (
                        <span className="flex items-center gap-1.5 text-slate-300 text-sm">
                          <Store className="w-3.5 h-3.5 text-slate-500" />
                          {u.store.name}
                        </span>
                      ) : <span className="text-slate-600 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => deleteMutation.mutate(u.id)}
                        className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-red-400 ml-auto cursor-pointer"
                        aria-label="Deletar usuário">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Novo Usuário</h2>
              <button onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Usuário *</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="joao.silva"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Senha *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="João Silva"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Perfil</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer">
                  <option value="STORE_ADMIN">Lojista</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {form.role === 'STORE_ADMIN' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Loja vinculada *</label>
                  <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer">
                    <option value="">Selecione uma loja</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.username || !form.password || (form.role === 'STORE_ADMIN' && !form.storeId)}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
