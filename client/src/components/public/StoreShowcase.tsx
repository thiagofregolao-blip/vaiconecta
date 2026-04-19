import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Store as StoreIcon } from 'lucide-react';
import { publicApi } from '../../api';
import ProductCard, { PublicProduct } from './ProductCard';

interface PublicStore {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  themeColor: string | null;
  bannerGradient: string | null;
  descricao: string | null;
  isPremium: boolean;
  cidade: string | null;
  productCount: number;
  products: PublicProduct[];
}

export default function StoreShowcase() {
  const { data: stores = [], isLoading } = useQuery<PublicStore[]>({
    queryKey: ['public-stores'],
    queryFn: () => publicApi.get('/stores').then(r => r.data),
  });

  const premium = stores.filter(s => s.isPremium);
  const regular = stores.filter(s => !s.isPremium);

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (stores.length === 0) return null;

  return (
    <div className="space-y-12 py-12">
      {premium.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">Lojas Premium</span>
            </div>
          </div>
          <div className="space-y-8">
            {premium.map(store => <StoreRow key={store.id} store={store} />)}
          </div>
        </section>
      )}

      {regular.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <h2 className="text-white text-2xl font-bold mb-5 flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-slate-400" />
            Lojas Parceiras
          </h2>
          <div className="space-y-8">
            {regular.map(store => <StoreRow key={store.id} store={store} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function StoreRow({ store }: { store: PublicStore }) {
  const theme = store.themeColor || '#f97316';
  const gradient = store.bannerGradient || 'from-rose-500 via-orange-500 to-amber-500';

  if (store.products.length === 0) return null;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:border-white/15 transition-colors">
      {/* Header da loja */}
      <div className={`relative bg-gradient-to-r ${gradient} p-5`}>
        {store.bannerUrl && (
          <img
            src={store.bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
          />
        )}
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-md border border-white/30 overflow-hidden shadow-lg flex items-center justify-center">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg drop-shadow">{store.name}</h3>
              <p className="text-white/80 text-xs drop-shadow">
                {store.productCount} produto{store.productCount !== 1 ? 's' : ''}
                {store.cidade ? ` · ${store.cidade}` : ''}
              </p>
            </div>
          </div>

          <Link
            to={`/loja/${store.slug}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md border border-white/30 text-white text-sm font-semibold transition-all hover:scale-[1.03]"
          >
            Ver +{store.productCount - store.products.length} ofertas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid de produtos */}
      <div className="p-4 md:p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {store.products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              storeSlug={store.slug}
              themeColor={theme}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}
