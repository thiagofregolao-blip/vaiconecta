import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wifi, Zap, Clock, Users, Tag, X,
  CreditCard, CheckCircle2, MapPin, Phone, Mail, Smartphone,
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
  { bg: 'from-blue-700 via-blue-600 to-cyan-600', text: 'Publicidade 1', sub: 'Seu anúncio aqui' },
  { bg: 'from-purple-700 via-purple-600 to-pink-600', text: 'Publicidade 2', sub: 'Alcance milhares de usuários' },
  { bg: 'from-emerald-700 via-green-600 to-teal-500', text: 'Publicidade 3', sub: 'Anuncie na VaiConecta' },
];

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get('mac') || '';
  const deviceIp = searchParams.get('ip') || '';

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [bannerIdx, setBannerIdx] = useState(0);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Marca como popular apenas o plano do meio (índice 1) se houver 3+ planos
  const popularId = plans.length >= 2 ? plans[Math.floor(plans.length / 2)]?.id : null;

  return (
    <div className="h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col overflow-hidden select-none">
      {/* bg glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-cyan-700/10 rounded-full blur-3xl" />
      </div>

      {/* ── HEADER ── */}
      <header className="shrink-0 flex flex-col items-center gap-3 pt-5 pb-3 px-6">
        {/* Logo sem qualquer fundo */}
        <img
          src="/logo01.png"
          alt="VaiConecta"
          className="h-20 w-auto object-contain"
          style={{ imageRendering: 'auto' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Menu */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-2 py-1.5">
          {([
            { key: 'como-funciona', label: 'Como funciona' },
            { key: 'sobre',         label: 'Sobre' },
            { key: 'contato',       label: 'Contato' },
          ] as { key: ModalType; label: string }[]).map(({ key, label }) => (
            <button
              key={key!}
              onClick={() => setActiveModal(key)}
              className="cursor-pointer rounded-xl px-5 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="flex-1 flex gap-4 px-6 pb-6 min-h-0">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex flex-col gap-3 w-64 shrink-0">

          {/* Banner rotativo */}
          <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/10">
            {BANNERS.map((b, i) => (
              <div
                key={i}
                className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${b.bg} transition-opacity duration-700`}
                style={{ opacity: i === bannerIdx ? 1 : 0 }}
              >
                <span className="text-white/30 text-xs uppercase tracking-widest mb-2">Publicidade</span>
                <p className="text-white font-extrabold text-lg">{b.text}</p>
                <p className="text-white/60 text-sm mt-1">{b.sub}</p>
              </div>
            ))}
            {/* Indicadores */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${i === bannerIdx ? 'bg-white w-6' : 'bg-white/30 w-1.5'}`}
                />
              ))}
            </div>
          </div>

          {/* Cards como funciona */}
          <div className="shrink-0 space-y-2">
            {[
              { icon: Wifi,          n: '01', title: 'Conecte no Wi-Fi' },
              { icon: CreditCard,    n: '02', title: 'Pague com Pix'    },
              { icon: CheckCircle2,  n: '03', title: 'Navegue livre'    },
            ].map(({ icon: Icon, n, title }) => (
              <div key={n} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="w-8 h-8 shrink-0 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/30 text-[10px] font-mono leading-none">{n}</p>
                  <p className="text-white text-sm font-semibold mt-0.5">{title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COLUNA DIREITA: PLANOS ── */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-extrabold">Escolha seu plano</h2>
              <p className="text-slate-500 text-xs mt-0.5">O tempo inicia no primeiro uso · Pix instantâneo</p>
            </div>
            {macAddress && (
              <span className="text-slate-600 text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-2 py-1">{macAddress}</span>
            )}
          </div>

          {/* Lista de planos */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[76px] rounded-2xl bg-white/5 animate-pulse" />
              ))
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <Wifi className="w-10 h-10 opacity-30" />
                <p>Nenhum plano disponível no momento</p>
              </div>
            ) : (
              plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  popular={plan.id === popularId}
                  onSelect={() => setSelectedPlan(plan)}
                />
              ))
            )}
          </div>

          {/* Rodapé */}
          <div className="shrink-0 flex items-center justify-between pt-1">
            <button
              onClick={() => setShowVoucher(true)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" /> Tenho um voucher
            </button>
            <p className="text-slate-700 text-xs">© {new Date().getFullYear()} VaiConecta</p>
          </div>
        </div>
      </main>

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

function PlanCard({ plan, popular, onSelect }: { plan: Plan; popular: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={`relative rounded-2xl border px-5 py-4 transition-all duration-150 hover:scale-[1.01] cursor-pointer
        ${popular
          ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-5 bg-blue-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
          Mais popular
        </span>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-bold text-base ${popular ? 'text-blue-100' : 'text-white'}`}>{plan.name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />{formatHours(plan.hours)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Users className="w-3 h-3" />{plan.maxDevices} disp.
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Zap className="w-3 h-3 text-yellow-400" />Ilimitado
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-6 shrink-0">
          <p className="text-2xl font-extrabold text-white">
            R$&nbsp;{plan.price.toFixed(2).replace('.', ',')}
          </p>
          <button
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer
              ${popular
                ? 'bg-blue-500 hover:bg-blue-400 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
          >
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoModal({ type, onClose }: { type: 'como-funciona' | 'sobre' | 'contato'; onClose: () => void }) {
  const titles = { 'como-funciona': 'Como funciona', sobre: 'Sobre a VaiConecta', contato: 'Fale conosco' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur p-6 animate-slide-up max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">{titles[type]}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {type === 'como-funciona' && (
          <div className="space-y-5">
            {[
              { icon: Wifi,         n: '01', title: 'Conecte no Wi-Fi',        desc: 'Procure a rede "VaiConecta" no seu celular. Você será redirecionado automaticamente para esta página.' },
              { icon: CreditCard,   n: '02', title: 'Escolha e pague com Pix', desc: 'Selecione o plano ideal, escaneie o QR Code e confirme o pagamento pelo seu banco em segundos.' },
              { icon: CheckCircle2, n: '03', title: 'Navegue livre',            desc: 'Acesso liberado automaticamente após confirmação. O tempo começa a contar no primeiro uso.' },
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
          <div className="space-y-5">
            <p className="text-slate-400 leading-relaxed text-sm">
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
            <div className="space-y-3">
              {[
                { icon: Zap,        title: 'Velocidade real',    desc: 'Wi-Fi 7 com baixa latência para streaming, jogos e chamadas.' },
                { icon: Smartphone, title: 'Sem aplicativo',     desc: 'Tudo funciona pelo navegador. Zero instalação.' },
                { icon: CreditCard, title: 'Pix instantâneo',    desc: 'Pagamento confirmado em segundos. Acesso liberado na hora.' },
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
            <p className="text-slate-400 text-sm mb-2">Precisa de ajuda? Estamos aqui.</p>
            {[
              { icon: Phone,  label: 'WhatsApp',   value: '(XX) 9XXXX-XXXX',            href: 'https://wa.me/55XX9XXXXXXXX' },
              { icon: Mail,   label: 'E-mail',      value: 'contato@vaiconecta.com.br',  href: 'mailto:contato@vaiconecta.com.br' },
              { icon: MapPin, label: 'Localização', value: 'Sua cidade, Estado',          href: '#' },
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
