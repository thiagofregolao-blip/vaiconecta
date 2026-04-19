import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

type Currency = 'BRL' | 'USD' | 'PYG';

export interface PublicProduct {
  id: string;
  nome: string;
  imagemUrl: string;
  precoBrl: number | null;
  precoUsd: number | null;
  precoGs: number | null;
  moedaOriginal: Currency;
  precoOriginal: number;
  categoria?: string | null;
  destaque?: boolean;
}

interface Props {
  product: PublicProduct;
  storeSlug: string;
  themeColor?: string;
  compact?: boolean;
}

const SYMBOL: Record<Currency, string> = { BRL: 'R$', USD: 'US$', PYG: 'Gs' };

function formatPrice(v: number | null, prefix: string) {
  if (!v) return null;
  return `${prefix} ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProductCard({ product, storeSlug, themeColor = '#f97316', compact = false }: Props) {
  const original = formatPrice(product.precoOriginal, SYMBOL[product.moedaOriginal]);
  const showBrlConversion = product.moedaOriginal !== 'BRL' && product.precoBrl;

  return (
    <Link
      to={`/loja/${storeSlug}/produto/${product.id}`}
      className="group block relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300"
    >
      {/* Badge destaque */}
      {product.destaque && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500 text-white shadow-lg">
          <Star className="w-2.5 h-2.5 fill-current" />
          Destaque
        </div>
      )}

      {/* Imagem */}
      <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
        <img
          src={product.imagemUrl}
          alt={product.nome}
          loading="lazy"
          className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500 ease-out"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
        />
      </div>

      {/* Info */}
      <div className={compact ? 'p-3' : 'p-4'}>
        {product.categoria && (
          <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-medium">
            {product.categoria}
          </p>
        )}

        <p className="text-white text-sm font-medium line-clamp-2 min-h-[2.5rem] leading-tight">
          {product.nome}
        </p>

        <div className="mt-2">
          <p className="font-bold text-lg leading-none" style={{ color: themeColor }}>
            {original}
          </p>
          {showBrlConversion && (
            <p className="text-slate-400 text-xs mt-1">
              ≈ R$ {product.precoBrl!.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
