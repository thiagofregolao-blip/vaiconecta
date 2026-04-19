import { useQuery } from '@tanstack/react-query';
import { Sparkles, Check, Calendar, AlertTriangle, Crown } from 'lucide-react';
import { lojistaApi } from '../../api';

interface StoreData {
  name: string;
  isPremium: boolean;
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
  subscriptionExpiresAt: string | null;
  themeColor: string | null;
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  TRIAL: { label: 'Em teste', color: '#3b82f6', icon: Sparkles, desc: 'Período de teste gratuito ativo.' },
  ACTIVE: { label: 'Ativo', color: '#10b981', icon: Check, desc: 'Assinatura em dia. Tudo funcionando.' },
  PAST_DUE: { label: 'Pagamento pendente', color: '#f59e0b', icon: AlertTriangle, desc: 'Regularize o pagamento para manter sua loja ativa.' },
  CANCELLED: { label: 'Cancelada', color: '#64748b', icon: AlertTriangle, desc: 'Assinatura cancelada. Loja não aparece na vitrine.' },
  SUSPENDED: { label: 'Suspensa', color: '#ef4444', icon: AlertTriangle, desc: 'Loja suspensa. Entre em contato com o suporte.' },
};

const BENEFITS = [
  'Vitrine pública exclusiva em /loja/sua-loja',
  'Até 1.000 produtos no catálogo',
  'Importação ilimitada por Excel',
  'Integração por API com sync automático',
  'Suporte prioritário',
  'Destaque na home VaiConecta (Premium)',
];

export default function LojistaSubscription() {
  const { data: store, isLoading } = useQuery<StoreData>({
    queryKey: ['lojista-store'],
    queryFn: () => lojistaApi.get('/store').then(r => r.data),
  });

  if (isLoading || !store) {
    return <div className="max-w-4xl mx-auto"><div className="h-64 bg-white/5 rounded-2xl animate-pulse" /></div>;
  }

  const status = STATUS_INFO[store.subscriptionStatus];
  const StatusIcon = status.icon;
  const theme = store.themeColor || '#f97316';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">Assinatura</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie seu plano e pagamentos.</p>
      </div>

      {/* Status atual */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 border border-white/10"
        style={{ background: `linear-gradient(135deg, ${status.color}22 0%, transparent 100%)` }}
      >
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: status.color }}
        />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${status.color}33`, border: `1px solid ${status.color}66` }}
              >
                <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Status</p>
                <p className="text-white font-bold text-xl" style={{ color: status.color }}>
                  {status.label}
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-sm max-w-md">{status.desc}</p>

            {store.subscriptionExpiresAt && (
              <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                Próximo vencimento: <span className="text-white font-medium">
                  {new Date(store.subscriptionExpiresAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {store.isPremium && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-sm font-semibold">
              <Crown className="w-4 h-4" />
              Premium
            </div>
          )}
        </div>
      </div>

      {/* Benefícios do plano */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: theme }} />
          O que está incluso na sua assinatura
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
              <Check className="w-4 h-4 shrink-0" style={{ color: theme }} />
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* CTA pagamento (placeholder) */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
        <p className="text-slate-400 text-sm mb-4">
          Integração de pagamento automático será ativada em breve. Por enquanto, entre em contato para renovação manual.
        </p>
        <a
          href="mailto:financeiro@vaiconecta.com.br"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: theme }}
        >
          Falar com o financeiro
        </a>
      </div>
    </div>
  );
}
