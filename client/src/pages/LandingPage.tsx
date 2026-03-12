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
  { bg: 'from-blue-600 to-cyan-500', text: 'Publicidade 1', sub: 'Seu anúncio aqui' },
  { bg: 'from-purple-600 to-pink-500', text: 'Publicidade 2', sub: 'Alcance milhares de usuários' },
  { bg: 'from-green-600 to-teal-500', text: 'Publicidade 3', sub: 'Anuncie na VaiConecta' },
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

  return (
    <div className="h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col overflow-hidden">
      {/* Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* ── HEADER: Logo + Menu ── */}
      <header className="flex flex-col items-center pt-5 pb-3 px-4 shrink-0">
        <img
          src="/logo01.png"
          alt="VaiConecta"
          className="h-24 w-auto mb-3 drop-shadow-lg"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
          }}
        />
        <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl px-2 py-1.5">
          {([
            { key: 'como-funciona', label: 'Como funciona' },
            { key: 'sobre', label: 'Sobre' },
            { key: 'contato', label: 'Contato' },
          ] as { key: ModalType; label: string }[]).map(({ key, label }) => (
            <button
              key={key!}
              onClick={() => setActiveModal(key)}
              className="text-slate-300 hover:text-white hover:bg-white/10 transition-all px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
        {/* Left column */}
        <div className="flex flex-col gap-3 w-72 shrink-0">
          {/* Banner rotativo */}
          <div className="relative rounded-2xl overflow-hidden flex-1 min-h-0">
            {BANNERS.map((b, i) => (
              <div
                key={i}
                className={`absolute inset-0 bg-gradient-to-br ${b.bg} transition-opacity duration-700 flex flex-col items-center justify-center`}
                style={{ opacity: i === bannerIdx ? 1 : 0 }}
              >
                <p className="text-white font-extrabold text-xl">{b.text}</p>
                <p className="text-white/70 text-sm mt-1">{b.sub}</p>
              </div>
            ))}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${i === bannerIdx ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`}
                />
              ))}
            </div>
          </div>

          {/* Como funciona (compact) */}
          <div className="space-y-2 shrink-0">
            {[
              { icon: Wifi, n: '01', title: 'Conecte no Wi-Fi' },
              { icon: CreditCard, n: '02', title: 'Pague com Pix' },
              { icon: CheckCircle2, n: '03', title: 'Navegue livre' },
            ].map(({ icon: Icon, n, title }) => (
              <div key={n} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <span className="text-white/30 text-xs font-mono">{n}</span>
                  <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Plans */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-white font-bold text-lg">Escolha seu plano</h2>
            {macAddress && (
              <span className="text-slate-500 text-xs font-mono">{macAddress}</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 animate-pulse h-20" />
              ))
            ) : plans.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-slate-500">
                <Wifi className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum plano disponível</p>
              </div>
            ) : (
              plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={() => setSelectedPlan(plan)} />
              ))
            )}
          </div>

          <div className="shrink-0 pt-1">
            <button
              onClick={() => setShowVoucher(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
            >
              <Tag className="w-4 h-4" /> Tenho um voucher
            </button>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
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

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  const isPopular = plan.hours === 24;
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-label={`Plano ${plan.name} por R$ ${plan.price.toFixed(2)}`}
      className={`relative glass rounded-2xl p-4 transition-all duration-200 hover:bg-white/15 hover:scale-[1.01] cursor-pointer ${isPopular ? 'border-blue-400/50 ring-1 ring-blue-400/30' : ''}`}
    >
      {isPopular && (
        <span className="absolute -top-2.5 left-4 bg-blue-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
          Mais popular
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-bold">{plan.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatHours(plan.hours)}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.maxDevices} disp.</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" />Ilimitado</span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <p className="text-xl font-extrabold text-white">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap">
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoModal({ type, onClose }: { type: 'como-funciona' | 'sobre' | 'contato'; onClose: () => void }) {
  const content: Record<string, { title: string; body: React.ReactNode }> = {
    'como-funciona': {
      title: 'Como funciona',
      body: (
        <div className="space-y-5">
          {[
            { icon: Wifi, n: '01', title: 'Conecte no Wi-Fi', desc: 'Procure a rede "VaiConecta" no seu celular e conecte. Você será redirecionado automaticamente para esta página.' },
            { icon: CreditCard, n: '02', title: 'Escolha e pague com Pix', desc: 'Selecione o plano ideal, escaneie o QR Code Pix e confirme o pagamento em segundos pelo seu banco.' },
            { icon: CheckCircle2, n: '03', title: 'Navegue livre', desc: 'Assim que o pagamento é confirmado, seu acesso é liberado automaticamente. O tempo começa a contar no primeiro uso.' },
          ].map(({ icon: Icon, n, title, desc }) => (
            <div key={n} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white/40 text-xs font-mono">{n}</p>
                <p className="text-white font-semibold">{title}</p>
                <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    'sobre': {
      title: 'Sobre a VaiConecta',
      body: (
        <div className="space-y-5">
          <p className="text-slate-400 leading-relaxed">
            A VaiConecta nasceu para democratizar o acesso à internet em locais públicos. Com tecnologia Wi-Fi 7 e infraestrutura de alto desempenho, garantimos a conexão mais rápida e estável.
          </p>
          <p className="text-slate-400 leading-relaxed">
            Nossa rede cobre 100% da área com 18 access points Ubiquiti de última geração, entregando sinal forte em todos os cantos.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Access Points', value: '18x' },
              { label: 'Padrão Wi-Fi', value: 'Wi-Fi 7' },
              { label: 'Pagamento', value: 'Pix Instant.' },
              { label: 'Uptime', value: '99.9%' },
            ].map((item) => (
              <div key={item.label} className="glass rounded-xl p-4">
                <p className="text-xl font-extrabold text-blue-400">{item.value}</p>
                <p className="text-slate-400 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { icon: Zap, title: 'Velocidade real', desc: 'Wi-Fi 7 com baixa latência para streaming, jogos e videochamadas.' },
              { icon: Smartphone, title: 'Sem aplicativo', desc: 'Tudo funciona pelo navegador do seu celular. Zero instalação.' },
              { icon: CreditCard, title: 'Pix instantâneo', desc: 'Pagamento confirmado em segundos. Acesso liberado na hora.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
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
      ),
    },
    'contato': {
      title: 'Fale conosco',
      body: (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Precisa de ajuda? Estamos aqui para você.</p>
          {[
            { icon: Phone, label: 'WhatsApp', value: '(XX) 9XXXX-XXXX', href: 'https://wa.me/55XX9XXXXXXXX' },
            { icon: Mail, label: 'E-mail', value: 'contato@vaiconecta.com.br', href: 'mailto:contato@vaiconecta.com.br' },
            { icon: MapPin, label: 'Localização', value: 'Sua cidade, Estado', href: '#' },
          ].map(({ icon: Icon, label, value, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer"
              className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/15 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            </a>
          ))}
        </div>
      ),
    },
  };

  const { title, body } = content[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-3xl w-full max-w-md p-6 animate-slide-up max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-xl">{title}</h2>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}
