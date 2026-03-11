import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wifi, Zap, Clock, Users, Tag } from 'lucide-react';
import { api } from '../api';
import PixModal from '../components/PixModal';
import VoucherModal from '../components/VoucherModal';

interface Plan {
  id: string;
  name: string;
  price: number;
  hours: number;
  maxDevices: number;
}

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get('mac') || '';
  const deviceIp = searchParams.get('ip') || '';

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  function formatHours(h: number) {
    if (h < 24) return `${h}h`;
    if (h < 168) return `${h / 24} dia${h / 24 > 1 ? 's' : ''}`;
    return `${h / 168} semana${h / 168 > 1 ? 's' : ''}`;
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center px-4 py-10 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
            <Wifi className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-gradient mb-2">VaiConecta</h1>
          <p className="text-slate-400 text-lg">Wi-Fi rápido. Pague com Pix, conecte na hora.</p>
          {macAddress && (
            <p className="text-slate-500 text-sm mt-2">
              Dispositivo: <span className="text-slate-400 font-mono">{macAddress}</span>
            </p>
          )}
        </div>

        {/* Planos */}
        <div className="w-full space-y-4 animate-slide-up">
          <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-2">
            Escolha seu plano
          </h2>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                <div className="h-5 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-8 bg-white/10 rounded w-1/4 mb-3" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
            ))
          ) : (
            plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                formatHours={formatHours}
                onSelect={() => setSelectedPlan(plan)}
              />
            ))
          )}
        </div>

        {/* Voucher */}
        <button
          onClick={() => setShowVoucher(true)}
          className="mt-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
        >
          <Tag className="w-4 h-4" />
          Tenho um voucher
        </button>

        {/* Footer */}
        <p className="text-slate-600 text-xs mt-8 text-center">
          O acesso inicia no primeiro uso e é contabilizado em tempo corrido.
          <br />
          Conexão segura · Suporte disponível
        </p>
      </div>

      {selectedPlan && (
        <PixModal
          plan={selectedPlan}
          macAddress={macAddress}
          deviceIp={deviceIp}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      {showVoucher && (
        <VoucherModal
          macAddress={macAddress}
          deviceIp={deviceIp}
          onClose={() => setShowVoucher(false)}
        />
      )}
    </div>
  );
}

function PlanCard({
  plan,
  formatHours,
  onSelect,
}: {
  plan: Plan;
  formatHours: (h: number) => string;
  onSelect: () => void;
}) {
  const isPopular = plan.hours === 24;

  return (
    <div
      className={`relative glass rounded-2xl p-5 transition-all duration-200 hover:bg-white/15 hover:scale-[1.01] cursor-pointer ${
        isPopular ? 'border-blue-400/50 ring-1 ring-blue-400/30' : ''
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-label={`Selecionar plano ${plan.name} por R$ ${plan.price.toFixed(2)}`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-4 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Mais popular
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{plan.name}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatHours(plan.hours)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {plan.maxDevices} dispositivo{plan.maxDevices > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Ilimitado
            </span>
          </div>
        </div>

        <div className="text-right ml-4">
          <p className="text-2xl font-extrabold text-white">
            R$ {plan.price.toFixed(2).replace('.', ',')}
          </p>
          <button className="mt-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors min-w-[80px] cursor-pointer">
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
}
