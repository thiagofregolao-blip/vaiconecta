import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, X, Loader2, ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '../../api';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link: string | null;
  active: boolean;
  order: number;
  createdAt: string;
}

export default function AdminBanners() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Banner | null>(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [order, setOrder] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: () => adminApi.get('/banners').then((r) => r.data),
  });

  function openCreate() {
    setModal('create'); setTitle(''); setLink(''); setOrder('0');
    setFile(null); setPreview(''); setError('');
  }

  function openEdit(b: Banner) {
    setModal(b); setTitle(b.title); setLink(b.link || '');
    setOrder(String(b.order)); setFile(null); setPreview(''); setError('');
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('link', link);
      fd.append('order', order);
      if (file) fd.append('image', file);

      if (modal === 'create') {
        return adminApi.post('/banners', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return adminApi.put(`/banners/${(modal as Banner).id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      setModal(null);
      setError('');
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/banners/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => {
      const fd = new FormData();
      fd.append('active', String(active));
      return adminApi.put(`/banners/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  const canSave = title.trim() !== '' && (modal !== 'create' || file !== null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Banners</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie os banners rotativos da página inicial</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum banner cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="glass rounded-2xl p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10">
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{b.title}</p>
                {b.link && <p className="text-slate-500 text-xs truncate mt-0.5">{b.link}</p>}
                <p className="text-slate-600 text-xs mt-0.5">Ordem: {b.order}</p>
              </div>

              {/* Ativo toggle */}
              <button
                onClick={() => toggleMutation.mutate({ id: b.id, active: !b.active })}
                className="cursor-pointer text-sm flex items-center gap-1.5 transition-colors"
                title={b.active ? 'Desativar' : 'Ativar'}
              >
                {b.active
                  ? <ToggleRight className="w-7 h-7 text-green-400" />
                  : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                <span className={b.active ? 'text-green-400 text-xs' : 'text-slate-600 text-xs'}>
                  {b.active ? 'Ativo' : 'Inativo'}
                </span>
              </button>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(b)}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-blue-400 cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteMutation.mutate(b.id)}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-red-400 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">
                {modal === 'create' ? 'Novo Banner' : 'Editar Banner'}
              </h2>
              <button onClick={() => setModal(null)}
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload de imagem */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Imagem {modal === 'create' ? '*' : '(deixe vazio para manter)'}
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-white/20 hover:border-blue-500/50 flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-white/5"
                >
                  {preview || (modal !== 'create' && (modal as Banner).imageUrl) ? (
                    <img
                      src={preview || (modal as Banner).imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Clique para selecionar</p>
                      <p className="text-slate-600 text-xs">JPG, PNG, WebP — máx 5MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Título *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Promoção de Verão"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Link (opcional)</label>
                <input value={link} onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Ordem</label>
                <input type="number" min="0" value={order} onChange={(e) => setOrder(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !canSave}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
