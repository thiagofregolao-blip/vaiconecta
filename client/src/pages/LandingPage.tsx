import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wifi, Tag, X, Users, ShieldCheck,
  CreditCard, CheckCircle2, MapPin, Phone, Mail, Smartphone, Zap,
} from 'lucide-react';
import { api } from '../api';
import PixModal from '../components/PixModal';
import VoucherModal from '../components/VoucherModal';

interface Plan { id: string; name: string; price: number; hours: number; maxDevices: number }
type ModalType = 'como-funciona' | 'sobre' | 'contato' | null;

function formatHours(h: number) {
  if (h < 24) return `${h}h`;
  if (h < 168) return `${h / 24} dia${h / 24 > 1 ? 's' : ''}`;
  return `${h / 168} semana${h / 168 > 1 ? 's' : ''}`;
}

const BANNERS = [
  { bg: 'from-blue-800 via-blue-700 to-cyan-700',       title: 'Publicidade 1', sub: 'Seu anúncio aqui' },
  { bg: 'from-purple-800 via-purple-700 to-pink-700',   title: 'Publicidade 2', sub: 'Alcance milhares de usuários' },
  { bg: 'from-emerald-800 via-green-700 to-teal-600',   title: 'Publicidade 3', sub: 'Anuncie na VaiConecta' },
];

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get('mac') || '';
  const deviceIp   = searchParams.get('ip')  || '';

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showVoucher,  setShowVoucher]  = useState(false);
  const [activeModal,  setActiveModal]  = useState<ModalType>(null);
  const [bannerIdx,    setBannerIdx]    = useState(0);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#0a1628] text-white">

      {/* ── 1. BARRA TOPO ── */}
      <div className="shrink-0 bg-gradient-to-r from-orange-500 to-red-500 py-2 text-center text-sm font-semibold tracking-wide">
        Conecte-se agora · Wi-Fi de alta velocidade onde você está!
      </div>

      {/* ── 2. HEADER ── */}
      <header className="shrink-0 bg-[#0d1b2e] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <img
            src="/logo01.png"
            alt="VaiConecta"
            className="h-10 w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <nav className="flex items-center gap-6">
            {([
              { key: 'como-funciona', label: 'Como funciona' },
              { key: 'sobre',         label: 'Sobre' },
              { key: 'contato',       label: 'Contato' },
            ] as { key: ModalType; label: string }[]).map(({ key, label }) => (
              <button
                key={key!}
                onClick={() => setActiveModal(key)}
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── 3. FAIXA DE PLANOS ── */}
      <div className="shrink-0 bg-[#0d1b2e] border-b border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto">

          {/* Label Wi-Fi */}
          <div className="flex items-center gap-2 mb-2.5">
            <Wifi className="w-4 h-4 text-blue-400" />
            <span className="text-white font-semibold text-sm">Wi-Fi 24 Horas</span>
            <span className="text-slate-400 text-sm">— fique conectado onde você estiver</span>
            {macAddress && (
              <span className="ml-auto text-slate-600 text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-0.5">
                {macAddress}
              </span>
            )}
          </div>

          {/* Cards dos planos */}
          {isLoading ? (
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 h-[68px] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-4">Nenhum plano disponível</div>
          ) : (
            <div className="flex gap-3">
              {plans.map((plan, idx) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  popular={idx === 0}
                  onSelect={() => setSelectedPlan(plan)}
                />
              ))}
            </div>
          )}

          {/* Rodapé planos */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pagamento seguro via Mercado Pago · Pix e mais
            </div>
            <button
              onClick={() => setShowVoucher(true)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3" /> Tenho um voucher
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. BANNER ROTATIVO ── */}
      <div className="flex-1 relative overflow-hidden">
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-gradient-to-br ${b.bg} flex flex-col items-center justify-center transition-opacity duration-700`}
            style={{ opacity: i === bannerIdx ? 1 : 0 }}
          >
            <span className="text-white/30 text-xs uppercase tracking-[0.3em] mb-4">Publicidade</span>
            <p className="text-white font-black text-5xl md:text-7xl">{b.title}</p>
            <p className="text-white/50 text-xl mt-3">{b.sub}</p>
          </div>
        ))}

        {/* Dots */}
        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2 z-10">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIdx(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${i === bannerIdx ? 'bg-white w-8' : 'bg-white/30 w-2'}`}
            />
          ))}
        </div>
      </div>

      {/* ── MODAIS ── */}
      {activeModal && <InfoModal type={activeModal} onClose={() => setActiveModal(null)} />}
      {selectedPlan && (
        <PixModal plan={selectedPlan} macAddress={macAddress} deviceIp={deviceIp} onClose={() => setSelectedPlan(null)} />
      )}
      {showVoucher && (
        <VoucherModal macAddress={macAddress} deviceIp={deviceIp} onClose={() => setShowVoucher(false)} />
      )}
    </div>
  );
}

/* ─── PLAN CARD ─── */
function PlanCard({ plan, popular, onSelect }: { plan: Plan; popular: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={`relative flex-1 flex items-center gap-4 rounded-xl px-4 py-3 cursor-pointer transition-all
        ${popular
          ? 'bg-[#1a2e4a] border border-blue-500/60 ring-1 ring-blue-500/20'
          : 'bg-[#111f33] border border-white/10 hover:bg-[#152238]'}`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
          Mais vendido
        </span>
      )}

      {/* Ícone */}
      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center
        ${popular ? 'bg-blue-500/25 border border-blue-500/40' : 'bg-white/8 border border-white/15'}`}>
        <Users className={`w-5 h-5 ${popular ? 'text-blue-300' : 'text-slate-400'}`} />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">{plan.name}</p>
        <p className="text-slate-400 text-xs mt-0.5">{formatHours(plan.hours)} de acesso contínuo</p>
      </div>

      {/* Preço + botão */}
      <div className="flex items-center gap-3 shrink-0">
        <p className={`font-extrabold text-xl ${popular ? 'text-blue-300' : 'text-white'}`}>
          R$ {plan.price.toFixed(2).replace('.', ',')}
        </p>
        <button
          className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap
            ${popular
              ? 'bg-blue-500 hover:bg-blue-400 text-white'
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
  const titles = {
    'como-funciona': 'Como funciona',
    sobre:           'Sobre a VaiConecta',
    contato:         'Fale conosco',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 animate-slide-up max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-xl">{titles[type]}</h2>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
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
