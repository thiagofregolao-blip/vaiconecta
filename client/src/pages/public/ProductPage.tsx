import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, MessageCircle, Share2, ExternalLink, Store as StoreIcon,
  Frown, Sparkles,
} from 'lucide-react';
import { publicApi } from '../../api';

type Currency = 'BRL' | 'USD' | 'PYG';

interface ProductDetail {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  marca: string | null;
  moedaOriginal: Currency;
  precoOriginal: number;
  precoBrl: number | null;
  precoUsd: number | null;
  precoGs: number | null;
  imagemUrl: string;
  produtoUrl: string | null;
  ativo: boolean;
  store: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    themeColor: string | null;
    bannerGradient: string | null;
    whatsapp: string | null;
    cidade: string | null;
  };
}

const SYMBOL: Record<Currency, string> = { BRL: 'R$', USD: 'US$', PYG: 'Gs' };

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();

  const { data: product, isLoading } = useQuery<ProductDetail>({
    queryKey: ['public-product', id],
    queryFn: () => publicApi.get(`/products/${id}`).then(r => r.data),
    retry: false,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-white/5 rounded-3xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-white/5 rounded animate-pulse" />
            <div className="h-12 w-1/2 bg-white/5 rounded animate-pulse" />
            <div className="h-24 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Frown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Produto não encontrado</h1>
          <Link to={`/loja/${slug}`} className="text-orange-400 hover:text-orange-300 text-sm">
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const theme = product.store.themeColor || '#f97316';
  const whatsAppNum = product.store.whatsapp?.replace(/\D/g, '');
  const whatsAppMsg = encodeURIComponent(`Olá! Tenho interesse no produto "${product.nome}".`);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product!.nome, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-950">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to={`/loja/${product.store.slug}`}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar a</span>
            <span className="font-semibold">{product.store.name}</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          {/* Imagem */}
          <div className="relative aspect-square bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
            <img
              src={product.imagemUrl}
              alt={product.nome}
              className="w-full h-full object-contain p-6"
            />
          </div>

          {/* Info */}
          <div>
            {/* Categoria & marca */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {product.categoria && (
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-medium">
                  {product.categoria}
                </span>
              )}
              {product.marca && (
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-medium">
                  {product.marca}
                </span>
              )}
            </div>

            <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight">
              {product.nome}
            </h1>

            {/* Preço */}
            <div
              className="mt-6 p-5 rounded-2xl border"
              style={{
                background: `linear-gradient(135deg, ${theme}22, ${theme}08)`,
                borderColor: `${theme}44`,
              }}
            >
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                A partir de
              </p>
              <p className="font-extrabold text-4xl md:text-5xl tracking-tight" style={{ color: theme }}>
                {SYMBOL[product.moedaOriginal]} {product.precoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center gap-3 text-slate-400 text-sm flex-wrap">
                {product.moedaOriginal !== 'BRL' && product.precoBrl && (
                  <span>≈ R$ {product.precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                )}
                {product.moedaOriginal !== 'USD' && product.precoUsd && (
                  <span>≈ US$ {product.precoUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                )}
                {product.moedaOriginal !== 'PYG' && product.precoGs && (
                  <span>≈ Gs {product.precoGs.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              {whatsAppNum && (
                <a
                  href={`https://wa.me/${whatsAppNum}?text=${whatsAppMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fb958] text-white font-bold shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar no WhatsApp
                </a>
              )}
              {product.produtoUrl && (
                <a
                  href={product.produtoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold shadow-lg transition-transform hover:scale-[1.02]"
                  style={{ background: theme }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver na loja
                </a>
              )}
            </div>

            {/* Descrição */}
            {product.descricao && (
              <div className="mt-8">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Descrição</h3>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                  {product.descricao}
                </p>
              </div>
            )}

            {/* Card da loja */}
            <Link
              to={`/loja/${product.store.slug}`}
              className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center shrink-0">
                {product.store.logoUrl ? (
                  <img src={product.store.logoUrl} alt={product.store.name} className="w-full h-full object-cover" />
                ) : (
                  <StoreIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-xs">Vendido por</p>
                <p className="text-white font-semibold truncate">{product.store.name}</p>
                {product.store.cidade && (
                  <p className="text-slate-500 text-xs">{product.store.cidade}</p>
                )}
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
