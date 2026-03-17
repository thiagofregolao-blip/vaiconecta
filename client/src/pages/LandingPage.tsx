import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wifi, Tag, X, User, Users, ShieldCheck,
  CreditCard, CheckCircle2, MapPin, Phone, Mail, Smartphone, Zap, Menu, Search,
} from 'lucide-react';
import { api } from '../api';
import PixModal from '../components/PixModal';
import VoucherModal from '../components/VoucherModal';
import SearchModal from '../components/SearchModal';

interface Plan { id: string; name: string; price: number; hours: number; maxDevices: number }
type ModalType = 'como-funciona' | 'sobre' | 'contato' | null;

function formatHours(h: number) {
  if (h < 24) return `${h}h`;
  if (h < 168) return `${h / 24} dia${h / 24 > 1 ? 's' : ''}`;
  return `${h / 168} semana${h / 168 > 1 ? 's' : ''}`;
}

function planStyle(maxDevices: number) {
  if (maxDevices === 1) return { bg: 'bg-blue-500',   icon: <User  className="w-5 h-5 text-white" /> };
  if (maxDevices === 2) return { bg: 'bg-orange-500', icon: <Users className="w-5 h-5 text-white" /> };
  return                       { bg: 'bg-rose-500',   icon: <Users className="w-6 h-6 text-white" /> };
}

interface Banner { id: string; title: string; imageUrl: string; link: string | null }

const FALLBACK_BANNERS = [
  { id: '1', title: 'Publicidade 1', imageUrl: '', link: null },
  { id: '2', title: 'Publicidade 2', imageUrl: '', link: null },
  { id: '3', title: 'Publicidade 3', imageUrl: '', link: null },
];

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get('mac') || '';
  const deviceIp   = searchParams.get('ip')  || '';

  const [pixPlan,      setPixPlan]      = useState<Plan | null>(null);
  const [highlightId,  setHighlightId]  = useState<string | null>(null);
  const [showVoucher,  setShowVoucher]  = useState(false);
  const [activeModal,  setActiveModal]  = useState<ModalType>(null);
  const [bannerIdx,    setBannerIdx]    = useState(0);
  const [mobileMenu,   setMobileMenu]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showSearch,   setShowSearch]   = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const QUICK_SEARCHES = ['iPhone', 'Samsung', 'Perfume', 'Notebook', 'Drone'];

  function handleSearch(q?: string) {
    const query = (q ?? searchQuery).trim();
    if (!query) return;
    setSearchQuery(query);
    setShowSearch(true);
  }

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  const { data: banners = FALLBACK_BANNERS } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: () => api.get('/banners').then((r) => r.data),
  });

  useEffect(() => {
    if (plans.length > 0 && !highlightId) setHighlightId(plans[0].id);
  }, [plans]);

  useEffect(() => {
    if (banners.length === 0) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  function handleComprar(e: React.MouseEvent, plan: Plan) {
    e.stopPropagation();
    setPixPlan(plan);
  }

  const navItems = [
    { key: 'como-funciona' as ModalType, label: 'Como funciona' },
    { key: 'sobre'         as ModalType, label: 'Sobre' },
    { key: 'contato'       as ModalType, label: 'Contato' },
  ];

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#0a1628] text-white">

      {/* ── 1. BARRA TOPO ── */}
      <div className="shrink-0 bg-gradient-to-r from-orange-500 to-red-500 py-1.5 text-center text-xs sm:text-sm font-semibold tracking-wide">
        Conecte-se agora · Wi-Fi de alta velocidade onde você está!
      </div>

      {/* ── 2. HEADER ── */}
      <header className="shrink-0 bg-[#0d1b2e] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-24 flex items-center relative">
          {/* Logo centralizado */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/logo02.png"
              alt="VaiConecta"
              className="h-12 sm:h-20 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Nav desktop */}
          <nav className="ml-auto hidden sm:flex items-center gap-5 relative z-10">
            {navItems.map(({ key, label }) => (
              <button key={key!} onClick={() => setActiveModal(key)}
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                {label}
              </button>
            ))}
          </nav>

          {/* Hamburger mobile */}
          <button onClick={() => setMobileMenu(!mobileMenu)}
            className="ml-auto sm:hidden relative z-10 text-slate-300 hover:text-white cursor-pointer p-1">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenu && (
          <div className="sm:hidden bg-[#0d1b2e] border-t border-white/10 px-4 py-3 flex flex-col gap-2">
            {navItems.map(({ key, label }) => (
              <button key={key!} onClick={() => { setActiveModal(key); setMobileMenu(false); }}
                className="text-left text-slate-300 hover:text-white text-sm font-medium py-2 cursor-pointer">
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── 3. FAIXA DE PLANOS — gradiente radial centrado em #11213C ── */}
      <div
        className="shrink-0 border-b border-white/10 px-4 sm:px-6 py-3"
        style={{ background: 'radial-gradient(ellipse at center, #11213C 0%, #060d18 100%)' }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Label Wi-Fi */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="relative flex shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40" />
              <Wifi className="relative w-4 h-4 text-blue-400" />
            </span>
            <span className="text-white font-semibold text-sm">Wi-Fi 24 Horas</span>
            <span className="text-slate-400 text-sm hidden sm:inline">— fique conectado nas suas compras no Paraguai</span>
            {macAddress && (
              <span className="ml-auto text-slate-600 text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-0.5 hidden sm:inline">
                {macAddress}
              </span>
            )}
          </div>

          {/* Cards dos planos — scroll horizontal no mobile */}
          {isLoading ? (
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 h-[68px] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4">Nenhum plano disponível</div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 pb-1">
              {plans.map((plan, idx) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  popular={idx === 0}
                  highlighted={plan.id === highlightId}
                  onClick={() => setHighlightId(plan.id)}
                  onComprar={(e) => handleComprar(e, plan)}
                />
              ))}
            </div>
          )}

          {/* Rodapé planos */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Pagamento seguro via Mercado Pago · </span>Pix e mais
            </div>
            <button onClick={() => setShowVoucher(true)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer shrink-0">
              <Tag className="w-3 h-3" /> Tenho um voucher
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. BANNER ROTATIVO ── */}
      <div className="flex-1 relative overflow-hidden bg-slate-900" onClick={() => searchInputRef.current?.focus()}>
        {banners.map((b, i) => (
          <div key={b.id} className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === bannerIdx ? 1 : 0 }}>
            {b.imageUrl ? (
              b.link ? (
                <a href={b.link} target="_blank" rel="noreferrer" className="block w-full h-full">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                </a>
              ) : (
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-800 to-cyan-700 flex flex-col items-center justify-center">
                <span className="text-white/30 text-xs uppercase tracking-[0.3em] mb-4">Publicidade</span>
                <p className="text-white font-black text-4xl sm:text-5xl">{b.title}</p>
              </div>
            )}
            {/* Overlay escuro para destacar barra de busca */}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)' }} />
          </div>
        ))}

        {banners.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 inset-x-0 flex justify-center gap-2 z-10">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${i === bannerIdx ? 'bg-white w-8' : 'bg-white/30 w-2'}`} />
            ))}
          </div>
        )}

        {/* ── BARRA DE BUSCA CENTRALIZADA ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 pointer-events-none">
          <div className="w-full max-w-xl pointer-events-auto" onClick={e => e.stopPropagation()}>
            {/* Search input */}
            <div className="flex items-center bg-white rounded-full overflow-hidden h-12 sm:h-14" style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 8px 40px rgba(0,0,0,0.5)' }}>
              <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar produtos, marcas, categorias..."
                className="flex-1 px-3 text-slate-800 placeholder-slate-400 text-sm sm:text-base outline-none bg-transparent h-full"
              />
              <button
                onClick={() => handleSearch()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 sm:px-6 h-full text-sm sm:text-base cursor-pointer transition-colors shrink-0"
              >
                Buscar
              </button>
            </div>

            {/* Quick searches */}
            <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
              <span className="text-white/70 text-xs">Buscas frequentes:</span>
              {QUICK_SEARCHES.map(q => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/30 cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAIS ── */}
      {activeModal && <InfoModal type={activeModal} onClose={() => setActiveModal(null)} />}
      {pixPlan && (
        <PixModal plan={pixPlan} macAddress={macAddress} deviceIp={deviceIp} onClose={() => setPixPlan(null)} />
      )}
      {showVoucher && (
        <VoucherModal macAddress={macAddress} deviceIp={deviceIp} onClose={() => setShowVoucher(false)} />
      )}
      {showSearch && (
        <SearchModal initialQuery={searchQuery} onClose={() => setShowSearch(false)} />
      )}
    </div>
  );
}

/* ─── PLAN CARD ─── */
function PlanCard({
  plan, popular, highlighted, onClick, onComprar,
}: {
  plan: Plan; popular: boolean; highlighted: boolean;
  onClick: () => void; onComprar: (e: React.MouseEvent) => void;
}) {
  const { bg, icon } = planStyle(plan.maxDevices);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`relative flex items-center gap-3 rounded-xl px-3 sm:px-4 py-3 cursor-pointer transition-all duration-200
        w-full sm:flex-1
        ${highlighted
          ? 'bg-[#1a2e4a] border border-blue-500/60 ring-1 ring-blue-500/20 scale-[1.01]'
          : 'bg-[#111f33] border border-white/10 hover:bg-[#152238]'}`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-3 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
          Mais vendido
        </span>
      )}

      {/* Ícone colorido */}
      <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center ${bg}`}>
        {icon}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-xs sm:text-sm leading-tight truncate">{plan.name}</p>
        <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5">{formatHours(plan.hours)} de acesso contínuo</p>
      </div>

      {/* Preço + botão */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <p className={`font-extrabold text-base sm:text-xl ${highlighted ? 'text-yellow-400' : 'text-white'}`}>
          R$&nbsp;{plan.price.toFixed(2).replace('.', ',')}
        </p>
        <button
          onClick={onComprar}
          className={`flex items-center gap-0.5 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap
            ${highlighted
              ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
        >
          Comprar →
        </button>
      </div>
    </div>
  );
}

/* ─── INFO MODAL ─── */
function InfoModal({ type, onClose }: { type: 'como-funciona' | 'sobre' | 'contato'; onClose: () => void }) {
  const titles = { 'como-funciona': 'Como funciona', sobre: 'Sobre a VaiConecta', contato: 'Fale conosco' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1b2e] p-5 sm:p-6 animate-slide-up max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg sm:text-xl">{titles[type]}</h2>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {type === 'como-funciona' && (
          <div className="space-y-5">
            {[
              { icon: Wifi,         n: '01', title: 'Conecte no Wi-Fi',        desc: 'Procure a rede "VaiConecta" no seu celular e conecte. Você será redirecionado automaticamente.' },
              { icon: CreditCard,   n: '02', title: 'Escolha e pague com Pix', desc: 'Selecione o plano, escaneie o QR Code e confirme pelo seu banco em segundos.' },
              { icon: CheckCircle2, n: '03', title: 'Navegue livre',            desc: 'Acesso liberado automaticamente. O tempo começa a contar no primeiro uso.' },
            ].map(({ icon: Icon, n, title, desc }) => (
              <div key={n} className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/30 text-xs font-mono">{n}</p>
                  <p className="text-white font-semibold">{title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {type === 'sobre' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm leading-relaxed">
              A VaiConecta nasceu para democratizar o acesso à internet em locais públicos. Com tecnologia Wi-Fi 7 e infraestrutura de alto desempenho, garantimos a conexão mais rápida e estável.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Access Points', value: '18x' },
                { label: 'Padrão Wi-Fi',  value: 'Wi-Fi 7' },
                { label: 'Pagamento',     value: 'Pix' },
                { label: 'Uptime',        value: '99.9%' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-xl font-extrabold text-blue-400">{item.value}</p>
                  <p className="text-slate-400 text-sm">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-1">
              {[
                { icon: Zap,        title: 'Velocidade real',  desc: 'Wi-Fi 7 com baixa latência para streaming, jogos e chamadas.' },
                { icon: Smartphone, title: 'Sem aplicativo',   desc: 'Tudo funciona pelo navegador. Zero instalação.' },
                { icon: CreditCard, title: 'Pix instantâneo',  desc: 'Pagamento confirmado em segundos. Acesso liberado na hora.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'contato' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm mb-1">Precisa de ajuda? Estamos aqui.</p>
            {[
              { icon: Phone,  label: 'WhatsApp',   value: '(XX) 9XXXX-XXXX',           href: 'https://wa.me/55XX9XXXXXXXX' },
              { icon: Mail,   label: 'E-mail',      value: 'contato@vaiconecta.com.br', href: 'mailto:contato@vaiconecta.com.br' },
              { icon: MapPin, label: 'Localização', value: 'Sua cidade, Estado',         href: '#' },
            ].map(({ icon: Icon, label, value, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all group">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-white font-semibold text-sm">{value}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
