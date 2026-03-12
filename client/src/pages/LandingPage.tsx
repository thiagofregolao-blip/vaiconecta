import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wifi, Zap, Clock, Users, Tag, Menu, X,
  Smartphone, CreditCard, CheckCircle2, MapPin, Phone, Mail, ChevronDown,
} from 'lucide-react';
import { api } from '../api';
import PixModal from '../components/PixModal';
import VoucherModal from '../components/VoucherModal';

interface Plan { id: string; name: string; price: number; hours: number; maxDevices: number }

function formatHours(h: number) {
  if (h < 24) return `${h}h`;
  if (h < 168) return `${h / 24} dia${h / 24 > 1 ? 's' : ''}`;
  return `${h / 168} semana${h / 168 > 1 ? 's' : ''}`;
}

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get('mac') || '';
  const deviceIp = searchParams.get('ip') || '';
  const isPortal = Boolean(searchParams.get('mac'));

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  }

  // Captive portal: vai direto para os planos
  useEffect(() => {
    if (isPortal) document.getElementById('planos')?.scrollIntoView();
  }, [isPortal]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white">
      {/* Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5 cursor-pointer">
            <img src="/logo.png" alt="VaiConecta" className="h-9 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-white font-extrabold text-xl tracking-tight">VaiConecta</span>
          </button>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollTo('como-funciona')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">Como funciona</button>
            <button onClick={() => scrollTo('planos')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">Planos</button>
            <button onClick={() => scrollTo('sobre')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">Sobre</button>
            <button onClick={() => scrollTo('contato')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">Contato</button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => scrollTo('planos')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors cursor-pointer">
              Conectar agora
            </button>
          </div>

          {/* Mobile menu btn */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-slate-400 cursor-pointer">
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-white/10 bg-slate-950 px-4 py-4 space-y-3 animate-fade-in">
            {['como-funciona', 'planos', 'sobre', 'contato'].map((id) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="block w-full text-left text-slate-300 hover:text-white py-2 text-sm capitalize cursor-pointer">
                {id.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
            <button onClick={() => scrollTo('planos')}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm cursor-pointer">
              Conectar agora
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="hero" className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-6">
          <Wifi className="w-4 h-4" /> Wi-Fi 7 · 18 Access Points · Cobertura total
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
          Internet rápida<br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            onde você está
          </span>
        </h1>
        <p className="text-slate-400 text-xl max-w-xl mx-auto mb-10">
          Conecte-se em segundos. Escolha seu plano, pague com Pix e navegue sem limite.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={() => scrollTo('planos')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors cursor-pointer flex items-center gap-2">
            <Zap className="w-5 h-5" /> Ver planos
          </button>
          <button onClick={() => scrollTo('como-funciona')}
            className="glass text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors cursor-pointer flex items-center gap-2">
            Como funciona <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        {macAddress && (
          <p className="text-slate-600 text-sm mt-8">
            Dispositivo detectado: <span className="font-mono text-slate-500">{macAddress}</span>
          </p>
        )}
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Como funciona</h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">
              Do zero à internet em menos de 1 minuto. Sem cadastro, sem burocracia.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Wifi, n: '01', title: 'Conecte no Wi-Fi', desc: 'Procure a rede "VaiConecta" no seu celular e conecte. Você será redirecionado automaticamente.' },
              { icon: CreditCard, n: '02', title: 'Escolha e pague', desc: 'Selecione o plano ideal, escaneie o QR Code Pix e confirme o pagamento em segundos.' },
              { icon: CheckCircle2, n: '03', title: 'Navegue livre', desc: 'Assim que o pagamento é confirmado, seu acesso é liberado automaticamente. Sem espera.' },
            ].map(({ icon: Icon, n, title, desc }) => (
              <div key={n} className="glass rounded-3xl p-7 relative overflow-hidden group hover:bg-white/15 transition-all">
                <div className="absolute top-4 right-5 text-6xl font-black text-white/5 group-hover:text-white/10 transition-colors">{n}</div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Escolha seu plano</h2>
            <p className="text-slate-400">O tempo começa a contar no primeiro uso. Sem surpresas.</p>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 animate-pulse h-24" />
              ))
            ) : (
              plans.map((plan) => <PlanCard key={plan.id} plan={plan} onSelect={() => setSelectedPlan(plan)} />)
            )}
          </div>

          <div className="text-center mt-8">
            <button onClick={() => setShowVoucher(true)}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
              <Tag className="w-4 h-4" /> Tenho um voucher
            </button>
          </div>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section id="sobre" className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Sobre a VaiConecta</h2>
              <p className="text-slate-400 leading-relaxed mb-5">
                A VaiConecta nasceu para democratizar o acesso à internet em locais públicos. Com tecnologia Wi-Fi 7 e infraestrutura de alto desempenho, garantimos a conexão mais rápida e estável para você.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                Nossa rede é operada por especialistas em telecomunicações e cobre 100% da área com 18 access points Ubiquiti de última geração, entregando sinal forte em todos os cantos.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Access Points', value: '18x' },
                  { label: 'Padrão Wi-Fi', value: 'Wi-Fi 7' },
                  { label: 'Pagamento', value: 'Pix Instant.' },
                  { label: 'Uptime', value: '99.9%' },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-2xl p-4">
                    <p className="text-2xl font-extrabold text-blue-400">{item.value}</p>
                    <p className="text-slate-400 text-sm">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl p-8 space-y-5">
              <h3 className="text-white font-bold text-xl mb-2">Por que escolher a VaiConecta?</h3>
              {[
                { icon: Zap, title: 'Velocidade real', desc: 'Wi-Fi 7 com baixa latência para streaming, jogos e videochamadas.' },
                { icon: Smartphone, title: 'Sem aplicativo', desc: 'Tudo funciona pelo navegador do seu celular. Zero instalação.' },
                { icon: CreditCard, title: 'Pix instantâneo', desc: 'Pagamento confirmado em segundos. Acesso liberado na hora.' },
                { icon: Users, title: 'Planos flexíveis', desc: 'Individual, dupla ou família. Você escolhe o que faz mais sentido.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-slate-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTATO ── */}
      <section id="contato" className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Fale conosco</h2>
            <p className="text-slate-400">Precisa de ajuda? Estamos aqui para você.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Phone, label: 'WhatsApp', value: '(XX) 9XXXX-XXXX', href: 'https://wa.me/55XX9XXXXXXXX' },
              { icon: Mail, label: 'E-mail', value: 'contato@vaiconecta.com.br', href: 'mailto:contato@vaiconecta.com.br' },
              { icon: MapPin, label: 'Localização', value: 'Sua cidade, Estado', href: '#' },
            ].map(({ icon: Icon, label, value, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                className="glass rounded-2xl p-6 text-center hover:bg-white/15 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="VaiConecta" className="h-7 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-white font-bold">VaiConecta</span>
          </div>
          <p className="text-slate-600 text-sm text-center">
            O acesso inicia no primeiro uso · Tempo corrido · Conexão segura
          </p>
          <p className="text-slate-700 text-xs">© {new Date().getFullYear()} VaiConecta</p>
        </div>
      </footer>

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
    <div onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-label={`Plano ${plan.name} por R$ ${plan.price.toFixed(2)}`}
      className={`relative glass rounded-2xl p-5 transition-all duration-200 hover:bg-white/15 hover:scale-[1.01] cursor-pointer ${isPopular ? 'border-blue-400/50 ring-1 ring-blue-400/30' : ''}`}>
      {isPopular && (
        <span className="absolute -top-3 left-4 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Mais popular
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{plan.name}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatHours(plan.hours)}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{plan.maxDevices} disp.</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-yellow-400" />Ilimitado</span>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-extrabold text-white">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
          <button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer">
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
}
