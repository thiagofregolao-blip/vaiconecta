import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Loader2, Wifi, Store as StoreIcon } from 'lucide-react';
import { adminApi } from '../../api';

interface Store {
  id: string;
  name: string;
  commissionPct: number;
  accessPoints: { id: string; name: string; apMac: string | null }[];
  admins: { id: string; username: string; name: string | null }[];
  createdAt: string;
}

export default function AdminStores() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Store | null>(null);
  const [formName, setFormName] = useState('');
  const [formComm, setFormComm] = useState('10');
  const [apModal, setApModal] = useState<Store | null>(null);
  const [apName, setApName] = useState('');
  const [apMac, setApMac] = useState('');
  const [error, setError] = useState('');

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ['admin-stores'],
    queryFn: () => adminApi.get('/stores').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (modal === 'create') return adminApi.post('/stores', { name: formName, commissionPct: Number(formComm) });
      return adminApi.put(`/stores/${(modal as Store).id}`, { name: formName, commissionPct: Number(formComm) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-stores'] }); setModal(null); setError(''); },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/stores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-stores'] }),
  });

  const addApMutation = useMutation({
    mutationFn: () => adminApi.post(`/stores/${apModal!.id}/aps`, { name: apName, apMac: apMac || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-stores'] }); setApName(''); setApMac(''); setApModal(null); },
  });

  const removeApMutation = useMutation({
    mutationFn: ({ storeId, apId }: { storeId: string; apId: string }) =>
      adminApi.delete(`/stores/${storeId}/aps/${apId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-stores'] }),
  });

  function openCreate() { setModal('create'); setFormName(''); setFormComm('10'); setError(''); }
  function openEdit(s: Store) { setModal(s); setFormName(s.name); setFormComm(String(s.commissionPct)); setError(''); }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Lojas</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie lojas e seus Access Points</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Nova Loja
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 animate-pulse h-32" />
        ))}</div>
      ) : stores.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <StoreIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma loja cadastrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <div key={store.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{store.name}</h3>
                  <p className="text-slate-400 text-sm">Comissão: <span className="text-blue-400 font-semibold">{store.commissionPct}%</span></p>
                  {store.admins.length > 0 && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      Admins: {store.admins.map((a) => a.name || a.username).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(store)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-blue-400 cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(store.id)}
                    className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-red-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" /> Access Points ({store.accessPoints.length})
                  </p>
                  <button onClick={() => { setApModal(store); setApName(''); setApMac(''); }}
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3 h-3" /> Adicionar AP
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {store.accessPoints.map((ap) => (
                    <div key={ap.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-white text-xs">{ap.name}</span>
                      {ap.apMac && <span className="text-slate-500 text-xs font-mono">{ap.apMac}</span>}
                      <button onClick={() => removeApMutation.mutate({ storeId: store.id, apId: ap.id })}
                        className="text-slate-600 hover:text-red-400 cursor-pointer ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {store.accessPoints.length === 0 && (
                    <p className="text-slate-600 text-xs">Nenhum AP cadastrado</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal loja */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">{modal === 'create' ? 'Nova Loja' : 'Editar Loja'}</h2>
              <button onClick={() => setModal(null)} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nome da loja</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Loja Centro"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Comissão (%)</label>
                <input type="number" min="0" max="100" step="0.5" value={formComm} onChange={(e) => setFormComm(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formName}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal AP */}
      {apModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Adicionar AP — {apModal.name}</h2>
              <button onClick={() => setApModal(null)} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nome do AP *</label>
                <input value={apName} onChange={(e) => setApName(e.target.value)} placeholder="Ex: AP Caixa 1"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">MAC do AP (opcional)</label>
                <input value={apMac} onChange={(e) => setApMac(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={() => addApMutation.mutate()} disabled={addApMutation.isPending || !apName}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                {addApMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Adicionar AP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
