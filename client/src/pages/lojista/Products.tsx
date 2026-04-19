import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit3, Trash2, Star, Eye, EyeOff, Package,
  Loader2, X, Check, Image as ImageIcon,
} from 'lucide-react';
import { lojistaApi } from '../../api';

type Currency = 'BRL' | 'USD' | 'PYG';

interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  marca: string | null;
  moedaOriginal: Currency;
  precoOriginal: number;
  precoBrl: number | null;
  precoUsd: number | null;
  precoGs: number | null;
  imagemUrl: string;
  produtoUrl: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  sourceType: string;
  createdAt: string;
}

const MOEDA_SYMBOL: Record<Currency, string> = {
  BRL: 'R$',
  USD: 'US$',
  PYG: 'Gs',
};

export default function LojistaProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterAtivo, setFilterAtivo] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['lojista-products'],
    queryFn: () => lojistaApi.get('/products').then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => lojistaApi.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lojista-products'] });
      qc.invalidateQueries({ queryKey: ['lojista-stats'] });
      showToast('Produto removido');
    },
    onError: () => showToast('Erro ao remover', false),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: 'ativo' | 'destaque'; value: boolean }) =>
      lojistaApi.put(`/products/${id}`, { [field]: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lojista-products'] }),
  });

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (filterAtivo === 'ativo' && !p.ativo) return false;
      if (filterAtivo === 'inativo' && p.ativo) return false;
      if (search && !p.nome.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, filterAtivo]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm animate-slide-in ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.ok ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">Meus Produtos</h1>
          <p className="text-slate-400 text-sm mt-1">
            {products.length} produto{products.length !== 1 ? 's' : ''} no catálogo
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg transition-all hover:scale-[1.02]"
        >
          <Plus size={16} />
          Novo produto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/20">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 text-sm outline-none flex-1"
          />
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {(['all', 'ativo', 'inativo'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterAtivo(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterAtivo === f ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 animate-pulse h-80" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">
            {products.length === 0 ? 'Nenhum produto ainda' : 'Nenhum produto encontrado'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => setEditing('new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold"
            >
              <Plus size={16} /> Adicionar primeiro produto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => setEditing(p)}
              onDelete={() => {
                if (confirm(`Remover "${p.nome}"?`)) deleteMut.mutate(p.id);
              }}
              onToggleAtivo={() => toggleMut.mutate({ id: p.id, field: 'ativo', value: !p.ativo })}
              onToggleDestaque={() => toggleMut.mutate({ id: p.id, field: 'destaque', value: !p.destaque })}
            />
          ))}
        </div>
      )}

      {/* Modal editar/novo */}
      {editing && (
        <ProductModal
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['lojista-products'] });
            qc.invalidateQueries({ queryKey: ['lojista-stats'] });
            setEditing(null);
            showToast('Produto salvo');
          }}
        />
      )}
    </div>
  );
}

function ProductCard({
  product, onEdit, onDelete, onToggleAtivo, onToggleDestaque,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAtivo: () => void;
  onToggleDestaque: () => void;
}) {
  return (
    <div className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      {/* Imagem */}
      <div className="relative aspect-[4/3] bg-slate-800/50 overflow-hidden">
        {product.imagemUrl ? (
          <img
            src={product.imagemUrl}
            alt={product.nome}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-600" />
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {!product.ativo && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-900/80 border border-white/20 text-slate-300">
              Inativo
            </span>
          )}
          {product.destaque && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/90 text-white flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              Destaque
            </span>
          )}
        </div>

        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton icon={product.ativo ? Eye : EyeOff} onClick={onToggleAtivo} title={product.ativo ? 'Ocultar' : 'Publicar'} />
          <IconButton icon={Star} onClick={onToggleDestaque} active={product.destaque} title="Destaque" />
          <IconButton icon={Edit3} onClick={onEdit} title="Editar" />
          <IconButton icon={Trash2} onClick={onDelete} title="Remover" danger />
        </div>
      </div>

      {/* Infos */}
      <div className="p-3 space-y-1.5">
        <p className="text-white text-sm font-medium line-clamp-2 min-h-[2.5rem]">
          {product.nome}
        </p>
        <div>
          <p className="text-orange-400 font-bold text-base">
            {MOEDA_SYMBOL[product.moedaOriginal]} {product.precoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {product.moedaOriginal !== 'BRL' && product.precoBrl && (
            <p className="text-slate-500 text-xs">
              ≈ R$ {product.precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        {product.categoria && (
          <p className="text-slate-500 text-[11px] uppercase tracking-wider">{product.categoria}</p>
        )}
      </div>
    </div>
  );
}

function IconButton({
  icon: Icon, onClick, title, danger, active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all hover:scale-110 ${
        active
          ? 'bg-amber-500 border-amber-400 text-white'
          : danger
          ? 'bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/40'
          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

// === Modal de edição/criação ===

function ProductModal({
  product, onClose, onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nome: product?.nome || '',
    descricao: product?.descricao || '',
    categoria: product?.categoria || '',
    marca: product?.marca || '',
    moedaOriginal: product?.moedaOriginal || 'BRL' as Currency,
    precoOriginal: product?.precoOriginal || 0,
    imagemUrl: product?.imagemUrl || '',
    produtoUrl: product?.produtoUrl || '',
    ativo: product?.ativo ?? true,
    destaque: product?.destaque ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (product) {
        await lojistaApi.put(`/products/${product.id}`, form);
      } else {
        await lojistaApi.post('/products', form);
      }
      onSaved();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">
            {product ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
            <div className="space-y-4">
              <Field label="Nome *">
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Fone JBL Tune 510BT"
                  className="input"
                />
              </Field>

              <Field label="Descrição">
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                  placeholder="Detalhes do produto..."
                  className="input resize-none"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria">
                  <input
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    placeholder="Eletrônicos"
                    className="input"
                  />
                </Field>
                <Field label="Marca">
                  <input
                    value={form.marca}
                    onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                    placeholder="JBL"
                    className="input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-[100px_1fr] gap-3">
                <Field label="Moeda *">
                  <select
                    value={form.moedaOriginal}
                    onChange={e => setForm(f => ({ ...f, moedaOriginal: e.target.value as Currency }))}
                    className="input"
                  >
                    <option value="BRL">R$ BRL</option>
                    <option value="USD">US$ USD</option>
                    <option value="PYG">Gs PYG</option>
                  </select>
                </Field>
                <Field label="Preço *">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precoOriginal || ''}
                    onChange={e => setForm(f => ({ ...f, precoOriginal: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="input"
                  />
                </Field>
              </div>

              <Field label="URL da Imagem *">
                <input
                  value={form.imagemUrl}
                  onChange={e => setForm(f => ({ ...f, imagemUrl: e.target.value }))}
                  placeholder="https://..."
                  className="input"
                />
              </Field>

              <Field label="URL externa (loja virtual)">
                <input
                  value={form.produtoUrl}
                  onChange={e => setForm(f => ({ ...f, produtoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="input"
                />
              </Field>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500"
                  />
                  Ativo na vitrine
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.destaque}
                    onChange={e => setForm(f => ({ ...f, destaque: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  Destaque
                </label>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Preview</p>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="aspect-[4/3] bg-slate-800/50 flex items-center justify-center">
                  {form.imagemUrl ? (
                    <img src={form.imagemUrl} alt="" className="w-full h-full object-contain p-3" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-white text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                    {form.nome || 'Nome do produto'}
                  </p>
                  <p className="text-orange-400 font-bold mt-1">
                    {MOEDA_SYMBOL[form.moedaOriginal]} {Number(form.precoOriginal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          <p className="text-rose-400 text-sm">{error}</p>
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-slate-400 hover:text-white text-sm">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.nome || !form.imagemUrl || !form.precoOriginal}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar produto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
