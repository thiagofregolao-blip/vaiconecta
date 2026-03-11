import { useState, useEffect, useCallback } from 'react';
import { X, Copy, CheckCircle2, Loader2, Wifi } from 'lucide-react';
import { api } from '../api';

interface Plan {
  id: string;
  name: string;
  price: number;
  hours: number;
}

interface Props {
  plan: Plan;
  macAddress: string;
  deviceIp: string;
  onClose: () => void;
}

type Step = 'email' | 'qrcode' | 'success';

export default function PixModal({ plan, macAddress, deviceIp, onClose }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [pixQrCode, setPixQrCode] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');
  const [copied, setCopied] = useState(false);

  const pollStatus = useCallback(async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/${id}/status`);
        if (data.status === 'ACTIVE' || data.status === 'APPROVED') {
          clearInterval(interval);
          setStep('success');
        }
      } catch {
        // silent
      }
    }, 2500);
    return interval;
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'qrcode' && paymentId) {
      pollStatus(paymentId).then((i) => { interval = i; });
    }
    return () => clearInterval(interval);
  }, [step, paymentId, pollStatus]);

  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/payments', {
        planId: plan.id,
        macAddress: macAddress || 'unknown',
        deviceIp,
        email,
      });
      setPaymentId(data.paymentId);
      setPixQrCode(data.pixQrCode);
      setPixQrCodeBase64(data.pixQrCodeBase64);
      setStep('qrcode');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar Pix. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(pixQrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-3xl w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">
              {step === 'success' ? 'Acesso liberado!' : `Plano ${plan.name}`}
            </h2>
            {step !== 'success' && (
              <p className="text-slate-400 text-sm">
                R$ {plan.price.toFixed(2).replace('.', ',')} via Pix
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step: Email */}
        {step === 'email' && (
          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-slate-400 mb-1.5">
                Seu e-mail (para comprovante)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando Pix...
                </>
              ) : (
                'Gerar QR Code Pix'
              )}
            </button>
          </form>
        )}

        {/* Step: QR Code */}
        {step === 'qrcode' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Aguardando confirmação do pagamento...
            </div>

            {pixQrCodeBase64 && (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixQrCodeBase64}`}
                  alt="QR Code Pix"
                  className="w-52 h-52 rounded-2xl bg-white p-2"
                />
              </div>
            )}

            <div className="glass rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-2">Ou copie o código Pix:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-slate-300 break-all line-clamp-2">
                  {pixQrCode}
                </code>
                <button
                  onClick={copyCode}
                  className="shrink-0 w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Copiar código Pix"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-slate-500 text-xs">
              O acesso é liberado automaticamente após o pagamento.
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-1">Pagamento confirmado!</h3>
              <p className="text-slate-400 text-sm">
                Seu acesso foi liberado por <strong className="text-white">{plan.name}</strong>.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                O tempo começa a contar a partir deste momento.
              </p>
            </div>
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <Wifi className="w-6 h-6 text-blue-400" />
              <div className="text-left">
                <p className="text-white text-sm font-semibold">Conectando ao Wi-Fi...</p>
                <p className="text-slate-400 text-xs">Você será redirecionado em instantes.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
