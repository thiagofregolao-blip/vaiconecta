import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Palette, Save, Loader2, CheckCircle, Instagram, MessageCircle,
  Store as StoreIcon, MapPin, Mail, Image as ImageIcon,
} from 'lucide-react';
import { lojistaApi } from '../../api';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  themeColor: string | null;
  bannerGradient: string | null;
  descricao: string | null;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
}

// Gradientes pré-definidos (tailwind classes)
const GRADIENTS: Array<{ name: string; value: string; preview: string }> = [
  { name: 'Pôr-do-sol', value: 'from-rose-500 via-orange-500 to-amber-500', preview: 'linear-gradient(135deg, #f43f5e, #f97316, #f59e0b)' },
  { name: 'Oceano', value: 'from-cyan-500 via-blue-500 to-indigo-500', preview: 'linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)' },
  { name: 'Floresta', value: 'from-emerald-500 via-teal-500 to-cyan-500', preview: 'linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)' },
  { name: 'Noite', value: 'from-indigo-600 via-purple-600 to-pink-600', preview: 'linear-gradient(135deg, #4f46e5, #9333ea, #db2777)' },
  { name: 'Cereja', value: 'from-pink-500 via-red-500 to-orange-500', preview: 'linear-gradient(135deg, #ec4899, #ef4444, #f97316)' },
  { name: 'Elegante', value: 'from-slate-700 via-slate-900 to-black', preview: 'linear-gradient(135deg, #334155, #0f172a, #000)' },
  { name: 'Tropical', value: 'from-lime-500 via-green-500 to-emerald-500', preview: 'linear-gradient(135deg, #84cc16, #22c55e, #10b981)' },
  { name: 'Dourado', value: 'from-amber-400 via-yellow-500 to-orange-500', preview: 'linear-gradient(135deg, #fbbf24, #eab308, #f97316)' },
];

const SUGGESTED_COLORS = [
  '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#eab308', '#84cc16', '#f59e0b', '#dc2626',
];

export default function LojistaBranding() {
  const qc = useQueryClient();
  const { data: store } = useQuery<StoreData>({
    queryKey: ['lojista-store'],
    queryFn: () => lojistaApi.get('/store').then(r => r.data),
  });

  const [form, setForm] = useState<Partial<StoreData>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (store && !form.id) setForm(store);
  }, [store, form.id]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const mut = useMutation({
    mutationFn: () => lojistaApi.put('/store', form),
    onSuccess: () => {
      showToast('Identidade salva');
      qc.invalidateQueries({ queryKey: ['lojista-store'] });
    },
    onError: () => showToast('Erro ao salvar', false),
  });

  const theme = form.themeColor || '#f97316';
  const gradient = form.bannerGradient || 'from-rose-500 via-orange-500 to-amber-500';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm animate-slide-in ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">Identidade da Loja</h1>
          <p className="text-slate-400 text-sm mt-1">Customize cores, logo, banner e contatos. Veja o preview ao lado.</p>
        </div>
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all hover:scale-[1.02]"
          style={{ background: theme }}
        >
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Formulário */}
        <div className="space-y-5">
          {/* Cor primária */}
          <Section icon={Palette} title="Cor principal" subtitle="Pinta botões, destaques e detalhes da sua vitrine.">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={theme}
                onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))}
                className="w-14 h-14 rounded-xl cursor-pointer bg-transparent border border-white/10"
              />
              <input
                type="text"
                value={theme}
                onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))}
                className="input w-32 font-mono uppercase"
              />
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, themeColor: c }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                      theme.toLowerCase() === c.toLowerCase() ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* Gradiente */}
          <Section title="Banner gradiente" subtitle="O fundo do topo da página da sua loja.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {GRADIENTS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setForm(f => ({ ...f, bannerGradient: g.value }))}
                  className={`h-20 rounded-xl border-2 relative overflow-hidden transition-transform hover:scale-[1.03] ${
                    gradient === g.value ? 'border-white shadow-lg' : 'border-white/10'
                  }`}
                  style={{ background: g.preview }}
                >
                  <span className="absolute bottom-1.5 left-2 text-white text-xs font-medium drop-shadow">
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Logo & Banner */}
          <Section icon={ImageIcon} title="Imagens">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="URL do Logo">
                <input
                  value={form.logoUrl || ''}
                  onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="input"
                />
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="logo" className="mt-2 w-16 h-16 rounded-xl object-cover border border-white/10" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
              </Field>
              <Field label="URL do Banner (opcional)">
                <input
                  value={form.bannerUrl || ''}
                  onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))}
                  placeholder="https://..."
                  className="input"
                />
                {form.bannerUrl && (
                  <img src={form.bannerUrl} alt="banner" className="mt-2 h-16 w-full rounded-xl object-cover border border-white/10" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
              </Field>
            </div>
          </Section>

          {/* Sobre a loja */}
          <Section icon={StoreIcon} title="Sobre a loja">
            <Field label="Nome">
              <input
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Descrição (aparece no topo da vitrine)">
              <textarea
                value={form.descricao || ''}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={3}
                placeholder="Fale um pouco sobre sua loja..."
                className="input resize-none"
              />
            </Field>
          </Section>

          {/* Contato */}
          <Section icon={MessageCircle} title="Contatos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="WhatsApp">
                <input
                  value={form.whatsapp || ''}
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="5545999999999"
                  className="input"
                />
              </Field>
              <Field label="Instagram">
                <input
                  value={form.instagram || ''}
                  onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                  placeholder="@minhaloja"
                  className="input"
                />
              </Field>
              <Field label="Email">
                <input
                  value={form.email || ''}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contato@minhaloja.com"
                  className="input"
                />
              </Field>
              <Field label="Cidade">
                <input
                  value={form.cidade || ''}
                  onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                  placeholder="Foz do Iguaçu, PR"
                  className="input"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Endereço">
                  <input
                    value={form.endereco || ''}
                    onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                    placeholder="Av. JK, 1234"
                    className="input"
                  />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* Preview */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-3">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Preview ao vivo</p>

          {/* Preview do banner da vitrine */}
          <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} h-40 shadow-2xl`}>
            {form.bannerUrl && (
              <img src={form.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
            )}
            <div className="relative z-10 h-full flex items-center p-5 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden shadow-lg">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <StoreIcon className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-lg drop-shadow truncate">{form.name || 'Minha Loja'}</p>
                {form.cidade && (
                  <p className="text-white/80 text-xs flex items-center gap-1 drop-shadow">
                    <MapPin className="w-3 h-3" />
                    {form.cidade}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card de produto preview */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] bg-slate-800/50 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-slate-600" />
            </div>
            <div className="p-3">
              <p className="text-white text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                Exemplo de Produto Premium
              </p>
              <p className="font-bold text-base mt-1" style={{ color: theme }}>
                R$ 199,00
              </p>
              <button
                className="mt-2 w-full py-2 rounded-lg text-white text-xs font-semibold"
                style={{ background: theme }}
              >
                Ver detalhes
              </button>
            </div>
          </div>

          {/* Mini rodapé de contato */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Rodapé</p>
            {form.whatsapp && (
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <MessageCircle className="w-3.5 h-3.5" style={{ color: theme }} />
                {form.whatsapp}
              </div>
            )}
            {form.instagram && (
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <Instagram className="w-3.5 h-3.5" style={{ color: theme }} />
                {form.instagram}
              </div>
            )}
            {form.email && (
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <Mail className="w-3.5 h-3.5" style={{ color: theme }} />
                {form.email}
              </div>
            )}
            {!form.whatsapp && !form.instagram && !form.email && (
              <p className="text-slate-500 text-xs italic">Adicione seus contatos acima</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  icon: Icon, title, subtitle, children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      {subtitle && <p className="text-slate-400 text-xs -mt-2">{subtitle}</p>}
      <div className="space-y-3">{children}</div>
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
