import { useState, useRef, useEffect } from 'react';
import { X, Send, Search, ExternalLink, Bot, ShoppingBag } from 'lucide-react';
import { api } from '../api';

interface Product {
  nome: string;
  preco_numerico: number;
  moeda: string;
  imagem_url: string;
  produto_url: string;
  loja: string;
}

interface SearchResult {
  aiMessage: string;
  products: Product[];
  total: number;
}

interface Props {
  initialQuery: string;
  onClose: () => void;
}

function formatPrice(preco: number, moeda: string) {
  if (moeda === 'USD') return `US$ ${preco.toLocaleString('pt-BR')}`;
  if (moeda === 'PYG') return `Gs ${preco.toLocaleString('pt-BR')}`;
  return `R$ ${preco.toLocaleString('pt-BR')}`;
}

export default function SearchModal({ initialQuery, onClose }: Props) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function doSearch(query: string) {
    const history = messages.slice(-10);
    setMessages(m => [...m, { role: 'user', text: query }]);
    setLoading(true);
    try {
      const res = await api.post('/search', { query, history });
      const data: SearchResult = res.data;
      setMessages(m => [...m, { role: 'ai', text: data.aiMessage || 'Busca realizada!' }]);
      setProducts(data.products || []);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Não consegui buscar agora. Tenta de novo!' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    doSearch(q);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-5xl h-[92dvh] sm:h-[80vh] bg-[#0d1b2e] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-2xl">

        {/* ── ESQUERDA: Chat ── */}
        <div className="flex flex-col w-full sm:w-[380px] sm:min-w-[380px] border-b sm:border-b-0 sm:border-r border-white/10 h-[45%] sm:h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 border-b border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Vai de Busca</p>
              <p className="text-blue-300 text-xs">IA de compras · LG Importados</p>
            </div>
            <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-slate-500 text-sm text-center mt-8">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Buscando produtos...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white/10 text-slate-200 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-4 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte algo sobre os produtos..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl px-3 py-2 cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── DIREITA: Produtos ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span className="text-white font-semibold text-sm">
              {products.length > 0 ? `${products.length} produto${products.length > 1 ? 's' : ''} encontrado${products.length > 1 ? 's' : ''}` : 'Produtos'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {products.length === 0 && !loading && (
              <div className="text-slate-500 text-sm text-center mt-12">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                Os produtos aparecerão aqui
              </div>
            )}

            {loading && products.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl bg-white/5 animate-pulse h-48" />
                ))}
              </div>
            )}

            {products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p, i) => (
                  <a
                    key={i}
                    href={p.produto_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl overflow-hidden transition-all"
                  >
                    {/* Imagem */}
                    <div className="aspect-square bg-white/5 overflow-hidden">
                      {p.imagem_url ? (
                        <img
                          src={p.imagem_url}
                          alt={p.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-white text-xs font-medium line-clamp-2 mb-1 leading-tight">{p.nome}</p>
                      {p.preco_numerico > 0 && (
                        <p className="text-blue-400 font-bold text-sm">{formatPrice(p.preco_numerico, p.moeda)}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        {p.loja} <ExternalLink className="w-2.5 h-2.5" />
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
