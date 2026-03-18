import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Trash2, Search, Package, AlertCircle, CheckCircle, Loader2, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminApi } from '../../api';

interface CatalogProduct {
  id: string;
  nome: string;
  precoGs: number | null;
  precoUsd: number | null;
  precoBrl: number | null;
  imagemUrl: string;
  produtoUrl: string;
  loja: string;
  createdAt: string;
}

interface ParsedRow {
  nome: string;
  precoGs?: number;
  precoUsd?: number;
  precoBrl?: number;
  imagemUrl: string;
  produtoUrl: string;
  loja?: string;
}

function parseNum(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  const clean = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? undefined : n;
}

function parseSheet(buffer: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  if (rows.length === 0) return [];

  const colKey = (row: Record<string, unknown>, names: string[]): unknown => {
    const key = Object.keys(row).find(k =>
      names.some(n => k.toLowerCase().includes(n))
    );
    return key ? row[key] : '';
  };

  return rows.flatMap(row => {
    const nome     = String(colKey(row, ['produto', 'nome', 'product', 'name', 'descri']) ?? '').trim();
    const produtoUrl = String(colKey(row, ['url produto', 'produto url', 'product url', 'url_prod', 'link']) ?? '').trim();
    if (!nome || !produtoUrl) return [];
    return [{
      nome,
      precoGs:  parseNum(colKey(row, ['gs', 'guarani', 'preço (g', 'preco (g'])),
      precoUsd: parseNum(colKey(row, ['usd', '($)', 'preço (u', 'preco (u', 'dollar'])),
      precoBrl: parseNum(colKey(row, ['brl', 'r$', 'real', 'preço (b', 'preco (b'])),
      imagemUrl: String(colKey(row, ['imagem', 'image', 'foto', 'img', 'url imagem']) ?? '').trim(),
      produtoUrl,
      loja: String(colKey(row, ['loja', 'store', 'shop']) ?? '').trim() || undefined,
    }];
  });
}

export default function AdminCatalog() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [search, setSearch] = useState('');
  const [replace, setReplace] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: products = [], isLoading } = useQuery<CatalogProduct[]>({
    queryKey: ['catalog'],
    queryFn: () => adminApi.get('/catalog').then(r => r.data),
  });

  const importMutation = useMutation({
    mutationFn: (rows: ParsedRow[]) =>
      adminApi.post('/catalog/import', { products: rows, replace }),
    onSuccess: (res) => {
      showToast(`${res.data.imported} produtos importados com sucesso!`);
      setPreview([]);
      setFileName('');
      qc.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: () => showToast('Erro ao importar produtos', false),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.delete('/catalog'),
    onSuccess: (res) => {
      showToast(`${res.data.deleted} produtos removidos`);
      qc.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: () => showToast('Erro ao limpar catálogo', false),
  });

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const buffer = e.target?.result as ArrayBuffer;
      const rows = parseSheet(buffer);
      setPreview(rows);
      if (rows.length === 0) showToast('Nenhum produto válido encontrado na planilha', false);
    };
    reader.readAsArrayBuffer(file);
  };

  const filtered = products.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.loja.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (v: number | null, prefix: string) =>
    v ? `${prefix} ${v.toLocaleString('pt-BR')}` : '—';

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm
          ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catálogo de Produtos</h1>
          <p className="text-slate-400 text-sm mt-1">
            {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={() => { if (confirm('Limpar todo o catálogo?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition-colors"
          >
            <Trash2 size={16} />
            Limpar tudo
          </button>
        )}
      </div>

      {/* Upload CSV */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Upload size={18} /> Importar Planilha
        </h2>

        <div className="text-xs text-slate-400 mb-4 bg-white/5 rounded-lg p-3">
          <strong className="text-slate-300">Colunas esperadas (ordem livre):</strong>{' '}
          Produto/Nome · Preço (Gs) · Preço (USD) · Preço (BRL) · URL Imagem · URL Produto · Loja (opcional)
          <br />
          <span className="text-slate-500 mt-1 block">Formatos aceitos: .xlsx, .xls, .ods</span>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          <Package size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="text-slate-300 text-sm">
            {fileName ? fileName : 'Arraste a planilha ou clique para selecionar'}
          </p>
          <p className="text-slate-500 text-xs mt-1">Arquivos .xlsx, .xls ou .ods</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium">
                ✓ {preview.length} produtos prontos para importar
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replace}
                    onChange={e => setReplace(e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  Substituir catálogo atual
                </label>
                <button
                  onClick={() => { setPreview([]); setFileName(''); }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-lg border border-white/10 max-h-48">
              <table className="w-full text-xs text-slate-300">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-right">Gs</th>
                    <th className="px-3 py-2 text-right">USD</th>
                    <th className="px-3 py-2 text-right">BRL</th>
                    <th className="px-3 py-2 text-left">Imagem</th>
                    <th className="px-3 py-2 text-left">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-3 py-1.5 max-w-[180px] truncate">{r.nome}</td>
                      <td className="px-3 py-1.5 text-right">{r.precoGs?.toLocaleString() ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right">{r.precoUsd ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right">{r.precoBrl ?? '—'}</td>
                      <td className="px-3 py-1.5 max-w-[100px] truncate text-blue-400">{r.imagemUrl ? '✓' : '—'}</td>
                      <td className="px-3 py-1.5 max-w-[120px] truncate text-blue-400">{r.produtoUrl.slice(0, 30)}…</td>
                    </tr>
                  ))}
                  {preview.length > 8 && (
                    <tr className="border-t border-white/5">
                      <td colSpan={6} className="px-3 py-1.5 text-slate-500 text-center">
                        + {preview.length - 8} mais…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => importMutation.mutate(preview)}
              disabled={importMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
            >
              {importMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {importMutation.isPending ? 'Importando…' : `Importar ${preview.length} produtos`}
            </button>
          </div>
        )}
      </div>

      {/* Catalog table */}
      {products.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar no catálogo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-white placeholder-slate-500 text-sm outline-none flex-1"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-white/5 sticky top-0 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Produto</th>
                    <th className="px-4 py-3 text-left">Loja</th>
                    <th className="px-4 py-3 text-right">Gs</th>
                    <th className="px-4 py-3 text-right">USD</th>
                    <th className="px-4 py-3 text-right">BRL</th>
                    <th className="px-4 py-3 text-center">Imagem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <a href={p.produtoUrl} target="_blank" rel="noopener noreferrer"
                          className="text-white hover:text-blue-400 transition-colors max-w-xs block truncate">
                          {p.nome}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{p.loja}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{formatPrice(p.precoGs, 'Gs')}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{formatPrice(p.precoUsd, 'US$')}</td>
                      <td className="px-4 py-3 text-right text-green-400 font-medium">{formatPrice(p.precoBrl, 'R$')}</td>
                      <td className="px-4 py-3 text-center">
                        {p.imagemUrl
                          ? <img src={p.imagemUrl} alt="" className="w-10 h-10 object-cover rounded mx-auto" />
                          : <span className="text-slate-600">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
