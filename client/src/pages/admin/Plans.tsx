import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Loader2, Clock, Users, DollarSign } from 'lucide-react';
import { adminApi } from '../../api';

interface Plan {
  id: string;
  name: string;
  price: number;
  hours: number;
  maxDevices: number;
  active: boolean;
}

interface FormData {
  name: string;
  price: string;
  hours: string;
  maxDevices: string;
}

const emptyForm: FormData = { name: '', price: '', hours: '', maxDevices: '1' };

export default function AdminPlans() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Plan | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState('');

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: () => adminApi.get('/plans').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const body = {
        name: data.name,
        price: Number(data.price),
        hours: Number(data.hours),
        maxDevices: Number(data.maxDevices),
      };
      if (modal === 'create') return adminApi.post('/plans', body);
      return adminApi.put(`/plans/${(modal as Plan).id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      setModal(null);
      setForm(emptyForm);
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  function openEdit(plan: Plan) {
    setModal(plan);
    setForm({ name: plan.name, price: String(plan.price), hours: String(plan.hours), maxDevices: String(plan.maxDevices) });
    setError('');
  }

  function openCreate() {
    setModal('create');
    setForm(emptyForm);
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  function formatHours(h: number) {
    if (h < 24) return `${h}h`;
    if (h < 168) return `${h / 24}d`;
    return `${h / 168}sem`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Planos</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie os planos de acesso</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-8 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`glass rounded-2xl p-5 ${!plan.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold">{plan.name}</h3>
                  {!plan.active && (
                    <span className="text-xs text-red-400 font-medium">Inativo</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                    aria-label="Editar plano"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(plan.id)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    aria-label="Desativar plano"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white mb-3">
                R$ {plan.price.toFixed(2).replace('.', ',')}
              </p>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatHours(plan.hours)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {plan.maxDevices} disp.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">
                {modal === 'create' ? 'Novo Plano' : 'Editar Plano'}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="plan-name" className="block text-sm text-slate-400 mb-1.5">Nome do plano</label>
                <input
                  id="plan-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: 24 Horas"
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="plan-price" className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Preço (R$)
                  </label>
                  <input
                    id="plan-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="10.00"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="plan-hours" className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Horas
                  </label>
                  <input
                    id="plan-hours"
                    type="number"
                    min="1"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="24"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="plan-devices" className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Pessoas
                  </label>
                  <input
                    id="plan-devices"
                    type="number"
                    min="1"
                    value={form.maxDevices}
                    onChange={(e) => setForm({ ...form, maxDevices: e.target.value })}
                    placeholder="1"
                    required
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Plano'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
