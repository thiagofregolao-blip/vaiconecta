import { useState } from 'react';
import { X, Tag, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

interface Props {
  macAddress: string;
  deviceIp: string;
  onClose: () => void;
}

export default function VoucherModal({ macAddress, deviceIp, onClose }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/payments/voucher', {
        code: code.trim().toUpperCase(),
        macAddress: macAddress || 'unknown',
        deviceIp,
      });
      setExpiresAt(data.expiresAt);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Voucher inválido ou já utilizado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-3xl w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-400" />
            <h2 className="text-white font-bold text-lg">Usar Voucher</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="voucher" className="block text-sm text-slate-400 mb-1.5">
                Código do voucher
              </label>
              <input
                id="voucher"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: A1B2C3D4"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-mono tracking-widest uppercase"
                maxLength={16}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ativar Voucher'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-white font-bold">Voucher ativado!</p>
              <p className="text-slate-400 text-sm mt-1">Acesso liberado com sucesso.</p>
              {expiresAt && (
                <p className="text-slate-500 text-xs mt-1">
                  Expira em: {new Date(expiresAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
