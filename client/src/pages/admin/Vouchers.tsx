import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Trash2, Copy, CheckCircle2, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../api';

interface Voucher {
  id: string;
  code: string;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
  plan: { name: string; hours: number };
}

interface Plan {
  id: string;
  name: string;
}

export default function AdminVouchers() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [planId, setPlanId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [copiedId, setCopiedId] = useState('');

  const { data: vouchers = [], isLoading } = useQuery<Voucher[]>({
    queryKey: ['admin-vouchers'],
    queryFn: () => adminApi.get('/vouchers').then((r) => r.data),
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['admin-plans-select'],
    queryFn: () => adminApi.get('/plans').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.post('/vouchers', { planId, quantity: Number(quantity), createdBy: 'admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vouchers'] });
      setShowModal(false);
      setPlanId('');
      setQuantity('1');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/vouchers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vouchers'] }),
  });

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  }

  const unused = vouchers.filter((v) => !v.usedBy).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Vouchers</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {unused} disponível{unused !== 1 ? 'is' : ''} · {vouchers.length - unused} utilizados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Gerar Vouchers
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum voucher gerado ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Código</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Plano</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Usado por</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-white font-mono text-sm tracking-widest">{v.code}</code>
                        <button
                          onClick={() => copyCode(v.code, v.id)}
                          className="text-slate-500 hover:text-slate-300 cursor-pointer"
                          aria-label="Copiar código"
                        >
                          {copiedId === v.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-slate-300 text-sm">{v.plan.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          v.usedBy
                            ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}
                      >
                        {v.usedBy ? 'Utilizado' : 'Disponível'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-slate-500 text-xs font-mono">{v.usedBy || '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!v.usedBy && (
                        <button
                          onClick={() => deleteMutation.mutate(v.id)}
                          className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors cursor-pointer ml-auto"
                          aria-label="Deletar voucher"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Gerar Vouchers</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="voucher-plan" className="block text-sm text-slate-400 mb-1.5">Plano</label>
                <select
                  id="voucher-plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Selecione um plano</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="voucher-qty" className="block text-sm text-slate-400 mb-1.5">Quantidade (máx. 100)</label>
                <input
                  id="voucher-qty"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !planId}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
