import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileSpreadsheet, Cloud, Loader2, CheckCircle, AlertCircle,
  Package, Play, Save, Zap, Link as LinkIcon, X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { lojistaApi } from '../../api';

type Currency = 'BRL' | 'USD' | 'PYG';
type Mode = 'excel' | 'api';

interface ExcelRow {
  nome: string;
  moedaOriginal: Currency;
  precoOriginal: number;
  imagemUrl: string;
  produtoUrl?: string;
  categoria?: string;
  marca?: string;
}

function parseNum(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  const s = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

function detectMoeda(row: Record<string, unknown>): { moeda: Currency; preco: number } {
  const col = (names: string[]) => {
    const k = Object.keys(row).find(k => names.some(n => k.toLowerCase().includes(n)));
    return k ? row[k] : '';
  };
  const brl = parseNum(col(['brl', 'r$', 'real', 'preço (b', 'preco (b']));
  const usd = parseNum(col(['usd', 'us$', '($)', 'dollar', 'dólar', 'preço (u', 'preco (u']));
  const gs = parseNum(col(['gs', 'guarani', 'preço (g', 'preco (g']));

  if (brl) return { moeda: 'BRL', preco: brl };
  if (usd) return { moeda: 'USD', preco: usd };
  if (gs) return { moeda: 'PYG', preco: gs };
  return { moeda: 'BRL', preco: 0 };
}

function parseSheet(buffer: ArrayBuffer): ExcelRow[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  const colKey = (row: Record<string, unknown>, names: string[]): unknown => {
    const k = Object.keys(row).find(k => names.some(n => k.toLowerCase().includes(n)));
    return k ? row[k] : '';
  };

  return rows.flatMap(row => {
    const nome = String(colKey(row, ['produto', 'nome', 'product', 'name', 'descri']) ?? '').trim();
    const imagemUrl = String(colKey(row, ['imagem', 'image', 'foto', 'img']) ?? '').trim();
    if (!nome || !imagemUrl) return [];
    const { moeda, preco } = detectMoeda(row);
    if (!preco) return [];
    return [{
      nome,
      moedaOriginal: moeda,
      precoOriginal: preco,
      imagemUrl,
      produtoUrl: String(colKey(row, ['url produto', 'produto url', 'product url', 'link']) ?? '').trim() || undefined,
      categoria: String(colKey(row, ['categoria', 'category']) ?? '').trim() || undefined,
      marca: String(colKey(row, ['marca', 'brand']) ?? '').trim() || undefined,
    }];
  });
}

export default function LojistaImport() {
  const [mode, setMode] = useState<Mode>('excel');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">Importar Produtos</h1>
        <p className="text-slate-400 text-sm mt-1">Envie uma planilha ou conecte a API do seu site.</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-white/5 border border-white/10 rounded-2xl p-1">
        <TabBtn active={mode === 'excel'} onClick={() => setMode('excel')} icon={FileSpreadsheet} label="Planilha Excel" />
        <TabBtn active={mode === 'api'} onClick={() => setMode('api')} icon={Cloud} label="API do seu site" />
      </div>

      {mode === 'excel' ? <ImportExcel /> : <ImportApi />}
    </div>
  );
}

function TabBtn({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ============ EXCEL ============

function ImportExcel() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [replace, setReplace] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const mut = useMutation({
    mutationFn: (rows: ExcelRow[]) => lojistaApi.post('/products/import', { products: rows, replace }),
    onSuccess: (res: any) => {
      const { imported, errors } = res.data;
      showToast(`${imported} produtos importados${errors?.length ? ` · ${errors.length} com erro` : ''}`);
      setPreview([]);
      setFileName('');
      qc.invalidateQueries({ queryKey: ['lojista-products'] });
      qc.invalidateQueries({ queryKey: ['lojista-stats'] });
    },
    onError: () => showToast('Erro ao importar', false),
  });

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const rows = parseSheet(e.target?.result as ArrayBuffer);
      setPreview(rows);
      if (!rows.length) showToast('Nenhum produto válido na planilha', false);
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm animate-slide-in ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-xs text-slate-400 bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
          <strong className="text-slate-200">Colunas aceitas (ordem livre):</strong><br />
          Produto/Nome · Preço BRL/USD/Gs · URL Imagem · URL Produto · Categoria · Marca
          <p className="text-slate-500 mt-1.5">Formatos: .xlsx, .xls, .ods — detectamos a moeda automaticamente.</p>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="border-2 border-dashed border-white/15 hover:border-orange-500/40 hover:bg-orange-500/[0.02] rounded-2xl p-10 text-center cursor-pointer transition-all"
        >
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-200 text-sm font-medium">
            {fileName || 'Arraste a planilha ou clique para selecionar'}
          </p>
          <p className="text-slate-500 text-xs mt-1">.xlsx, .xls ou .ods</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.ods"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {preview.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5">
                <CheckCircle size={16} />
                {preview.length} produtos prontos para importar
              </span>
              <button
                onClick={() => { setPreview([]); setFileName(''); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={replace}
                onChange={e => setReplace(e.target.checked)}
                className="w-4 h-4 accent-orange-500"
              />
              Substituir todos os produtos atuais
            </label>

            <div className="overflow-x-auto rounded-xl border border-white/10 max-h-52">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2">Moeda</th>
                    <th className="px-3 py-2 text-right">Preço</th>
                    <th className="px-3 py-2">Img</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t border-white/5 text-slate-300">
                      <td className="px-3 py-1.5 max-w-[240px] truncate">{r.nome}</td>
                      <td className="px-3 py-1.5 text-center">{r.moedaOriginal}</td>
                      <td className="px-3 py-1.5 text-right">{r.precoOriginal.toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-1.5 text-center">{r.imagemUrl ? '✓' : '—'}</td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr className="border-t border-white/5">
                      <td colSpan={4} className="px-3 py-1.5 text-slate-500 text-center">
                        + {preview.length - 10} mais
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => mut.mutate(preview)}
              disabled={mut.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl font-semibold transition-colors"
            >
              {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {mut.isPending ? 'Importando...' : `Importar ${preview.length} produtos`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ API EXTERNA ============

interface ImportConfig {
  apiUrl: string;
  apiMethod: string;
  apiHeaders: Record<string, string> | null;
  fieldMapping: Record<string, string>;
  rootPath: string | null;
  autoSyncEnabled: boolean;
  syncIntervalHours: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
}

const DEFAULT_MAPPING: Record<string, string> = {
  nome: 'title',
  precoOriginal: 'price',
  moedaOriginal: 'currency',
  imagemUrl: 'image',
  produtoUrl: 'url',
  descricao: 'description',
  categoria: 'category',
  marca: 'brand',
  externalId: 'id',
};

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome do produto *',
  precoOriginal: 'Preço *',
  moedaOriginal: 'Moeda (BRL/USD/PYG)',
  imagemUrl: 'URL da imagem *',
  produtoUrl: 'URL do produto',
  descricao: 'Descrição',
  categoria: 'Categoria',
  marca: 'Marca',
  externalId: 'ID único (pra atualizar em vez de duplicar)',
};

function ImportApi() {
  const qc = useQueryClient();
  const { data: config } = useQuery<ImportConfig | null>({
    queryKey: ['lojista-import-config'],
    queryFn: () => lojistaApi.get('/import/config').then(r => r.data),
  });

  const [form, setForm] = useState<ImportConfig>({
    apiUrl: '',
    apiMethod: 'GET',
    apiHeaders: null,
    fieldMapping: { ...DEFAULT_MAPPING },
    rootPath: null,
    autoSyncEnabled: false,
    syncIntervalHours: 24,
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncError: null,
  });
  const [headersRaw, setHeadersRaw] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [replace, setReplace] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Hidrata form com dados salvos (uma vez)
  if (config && !initialized) {
    setForm({ ...form, ...config, fieldMapping: { ...DEFAULT_MAPPING, ...config.fieldMapping } });
    if (config.apiHeaders) setHeadersRaw(JSON.stringify(config.apiHeaders, null, 2));
    setInitialized(true);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function buildPayload() {
    let headers: Record<string, string> | null = null;
    if (headersRaw.trim()) {
      try {
        headers = JSON.parse(headersRaw);
      } catch {
        throw new Error('Headers JSON inválido');
      }
    }
    return {
      apiUrl: form.apiUrl,
      apiMethod: form.apiMethod,
      apiHeaders: headers,
      fieldMapping: form.fieldMapping,
      rootPath: form.rootPath || null,
      autoSyncEnabled: form.autoSyncEnabled,
      syncIntervalHours: form.syncIntervalHours,
    };
  }

  const saveMut = useMutation({
    mutationFn: () => lojistaApi.put('/import/config', buildPayload()),
    onSuccess: () => {
      showToast('Configuração salva');
      qc.invalidateQueries({ queryKey: ['lojista-import-config'] });
    },
    onError: (e: any) => showToast(e.response?.data?.error || 'Erro ao salvar', false),
  });

  const runMut = useMutation({
    mutationFn: () => lojistaApi.post('/import/run', { replace }),
    onSuccess: (res: any) => {
      const { imported, updated, skipped, total } = res.data;
      showToast(`${imported} novos, ${updated} atualizados, ${skipped} ignorados (${total})`);
      qc.invalidateQueries({ queryKey: ['lojista-products'] });
      qc.invalidateQueries({ queryKey: ['lojista-stats'] });
      qc.invalidateQueries({ queryKey: ['lojista-import-config'] });
    },
    onError: (e: any) => showToast(e.response?.data?.error || 'Erro ao importar', false),
  });

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await lojistaApi.post('/import/test', buildPayload());
      setTestResult(data);
      showToast(`Conectado! ${data.total} produtos encontrados`);
    } catch (e: any) {
      setTestResult({ error: e.response?.data?.error || e.message });
      showToast(e.response?.data?.error || 'Falha na conexão', false);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm animate-slide-in ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-sm text-slate-300">
        <p className="font-medium text-white mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          Como funciona
        </p>
        <p className="text-slate-400">
          Conecte a URL da API do seu site que retorna seus produtos em JSON.
          Mapeie qual campo do seu sistema corresponde ao nosso (ex: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">title</code> → <code className="text-blue-300 bg-blue-500/10 px-1 rounded">Nome</code>).
          O VaiConecta busca a API periodicamente e sincroniza os produtos automaticamente.
        </p>
      </div>

      {/* Configuração da URL */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon className="w-4 h-4 text-orange-400" />
          <h3 className="text-white font-semibold">Endpoint da API</h3>
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-3">
          <select
            value={form.apiMethod}
            onChange={e => setForm(f => ({ ...f, apiMethod: e.target.value }))}
            className="input"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
          <input
            value={form.apiUrl}
            onChange={e => setForm(f => ({ ...f, apiUrl: e.target.value }))}
            placeholder="https://seusite.com.br/api/produtos"
            className="input font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1.5">
            Headers (JSON opcional — ex: token de autenticação)
          </label>
          <textarea
            value={headersRaw}
            onChange={e => setHeadersRaw(e.target.value)}
            placeholder='{ "Authorization": "Bearer xxx" }'
            rows={3}
            className="input resize-none font-mono text-xs"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs uppercase tracking-wider block mb-1.5">
            Caminho do array no JSON (opcional)
          </label>
          <input
            value={form.rootPath || ''}
            onChange={e => setForm(f => ({ ...f, rootPath: e.target.value }))}
            placeholder="Ex: data.products — deixe vazio se a raiz já for um array"
            className="input font-mono text-sm"
          />
        </div>
      </div>

      {/* Mapeamento de campos */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1">Mapeamento de campos</h3>
        <p className="text-slate-400 text-xs mb-4">
          Preencha com o nome do campo no JSON do seu site. Use pontos pra campos aninhados (ex: <code>meta.brand</code>).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.keys(DEFAULT_MAPPING).map(key => (
            <div key={key}>
              <label className="text-slate-400 text-xs font-medium block mb-1">{FIELD_LABELS[key]}</label>
              <input
                value={form.fieldMapping[key] || ''}
                onChange={e => setForm(f => ({
                  ...f,
                  fieldMapping: { ...f.fieldMapping, [key]: e.target.value },
                }))}
                placeholder={DEFAULT_MAPPING[key]}
                className="input font-mono text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Teste */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-white font-semibold">Testar conexão</h3>
            <p className="text-slate-400 text-xs mt-0.5">Verifica se a API responde e mostra um preview.</p>
          </div>
          <button
            onClick={handleTest}
            disabled={testing || !form.apiUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 disabled:opacity-40 text-white text-sm font-medium"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Testar
          </button>
        </div>

        {testResult && !testResult.error && (
          <div className="space-y-3">
            <p className="text-emerald-400 text-sm font-medium flex items-center gap-1.5">
              <CheckCircle size={16} />
              {testResult.total} produtos na API · preview das 5 primeiras linhas
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2">Moeda</th>
                    <th className="px-3 py-2 text-right">Preço</th>
                    <th className="px-3 py-2">Imagem</th>
                  </tr>
                </thead>
                <tbody>
                  {testResult.preview.map((p: any, i: number) => (
                    <tr key={i} className="border-t border-white/5 text-slate-300">
                      <td className="px-3 py-1.5 max-w-[240px] truncate">{p.nome || '—'}</td>
                      <td className="px-3 py-1.5 text-center">{p.moedaOriginal || '—'}</td>
                      <td className="px-3 py-1.5 text-right">{p.precoOriginal?.toLocaleString('pt-BR') || '—'}</td>
                      <td className="px-3 py-1.5 text-center">{p.imagemUrl ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {testResult.sampleKeys?.length > 0 && (
              <details className="text-xs text-slate-400">
                <summary className="cursor-pointer hover:text-slate-200">Campos disponíveis no JSON ({testResult.sampleKeys.length})</summary>
                <div className="mt-2 flex flex-wrap gap-1">
                  {testResult.sampleKeys.map((k: string) => (
                    <code key={k} className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">{k}</code>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {testResult?.error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm text-rose-300">
            <p className="font-medium text-rose-200 mb-1 flex items-center gap-1.5">
              <AlertCircle size={16} />
              Falha no teste
            </p>
            <p>{testResult.error}</p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07]">
            <input
              type="checkbox"
              checked={form.autoSyncEnabled}
              onChange={e => setForm(f => ({ ...f, autoSyncEnabled: e.target.checked }))}
              className="w-4 h-4 mt-0.5 accent-orange-500"
            />
            <div>
              <p className="text-white text-sm font-medium">Sincronizar automaticamente</p>
              <p className="text-slate-400 text-xs mt-0.5">
                VaiConecta busca a API a cada {form.syncIntervalHours}h
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07]">
            <input
              type="checkbox"
              checked={replace}
              onChange={e => setReplace(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-rose-500"
            />
            <div>
              <p className="text-white text-sm font-medium">Substituir catálogo via API</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Apaga produtos vindos da API antes de importar (mantém os manuais).
              </p>
            </div>
          </label>
        </div>

        {config?.lastSyncAt && (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Package className="w-3 h-3" />
            Última sincronização: {new Date(config.lastSyncAt).toLocaleString('pt-BR')} · {' '}
            <span className={config.lastSyncStatus === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
              {config.lastSyncStatus === 'success' ? 'sucesso' : config.lastSyncError}
            </span>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !form.apiUrl}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 disabled:opacity-40 text-white font-semibold text-sm"
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar configuração
          </button>
          <button
            onClick={() => runMut.mutate()}
            disabled={runMut.isPending || !form.apiUrl}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold text-sm shadow-lg"
          >
            {runMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {runMut.isPending ? 'Importando...' : 'Importar agora'}
          </button>
        </div>
      </div>
    </div>
  );
}
