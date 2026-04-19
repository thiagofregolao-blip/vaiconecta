import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Store as StoreIcon, MapPin, MessageCircle, Instagram, Mail,
  ArrowLeft, Filter, Sparkles, Frown,
} from 'lucide-react';
import { publicApi } from '../../api';
import ProductCard, { PublicProduct } from '../../components/public/ProductCard';

interface Store {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  themeColor: string | null;
  bannerGradient: string | null;
  descricao: string | null;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  isPremium: boolean;
}

type Sort = 'default' | 'price-asc' | 'price-desc' | 'name';

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('default');

  const { data: store, isLoading: loadingStore } = useQuery<Store>({
    queryKey: ['public-store', slug],
    queryFn: () => publicApi.get(`/stores/${slug}`).then(r => r.data),
    retry: false,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<PublicProduct[]>({
    queryKey: ['public-store-products', slug, search, sort],
    queryFn: () => publicApi.get(`/stores/${slug}/products`, {
      params: { search: search || undefined, sort: sort === 'default' ? undefined : sort },
    }).then(r => r.data),
    enabled: !!store,
  });

  if (loadingStore) {
    return (
      <div className="min-h-dvh bg-slate-950">
        <div className="h-64 bg-white/5 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Frown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Loja não encontrada</h1>
          <p className="text-slate-400 mb-6">Essa loja pode ter sido desativada.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Voltar para a home
          </Link>
        </div>
      </div>
    );
  }

  const theme = store.themeColor || '#f97316';
  const gradient = store.bannerGradient || 'from-rose-500 via-orange-500 to-amber-500';
  const whatsAppNum = store.whatsapp?.replace(/\D/g, '');

  return (
    <div className="min-h-dvh bg-slate-950" style={{ ['--brand' as string]: theme } as React.CSSProperties}>
      {/* Banner hero */}
      <section
        className={`relative bg-gradient-to-br ${gradient} overflow-hidden`}
      >
        {store.bannerUrl && (
          <img
            src={store.bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
          />
        )}

        {/* Glow decorativo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-black/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-10">
          {/* Top bar: voltar */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            VaiConecta
          </Link>

          <div className="flex items-end gap-4 md:gap-6 flex-wrap">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-white/25 backdrop-blur-xl border-2 border-white/40 overflow-hidden shadow-2xl flex items-center justify-center shrink-0">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="w-10 h-10 md:w-14 md:h-14 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {store.isPremium && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/30 backdrop-blur-md border border-amber-300/60 text-amber-100 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  Premium
                </div>
              )}
              <h1 className="text-white font-extrabold text-2xl md:text-4xl leading-tight drop-shadow">
                {store.name}
              </h1>
              {store.cidade && (
                <p className="flex items-center gap-1.5 text-white/90 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {store.cidade}
                </p>
              )}
              {store.descricao && (
                <p className="text-white/80 text-sm mt-3 max-w-2xl leading-relaxed">
                  {store.descricao}
                </p>
              )}

              {/* Contatos */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {whatsAppNum && (
                  <a
                    href={`https://wa.me/${whatsAppNum}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#1fb958] text-white text-xs font-semibold shadow-lg transition-transform hover:scale-[1.03]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
                {store.instagram && (
                  <a
                    href={`https://instagram.com/${store.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md border border-white/30 text-white text-xs font-semibold transition-all hover:scale-[1.03]"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    {store.instagram}
                  </a>
                )}
                {store.email && (
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md border border-white/30 text-white text-xs font-semibold transition-all hover:scale-[1.03]"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros sticky */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/20">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto nesta loja..."
              className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-white/20 cursor-pointer"
            >
              <option value="default">Recomendados</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>

          <p className="text-slate-400 text-sm ml-auto">
            {products.length} produto{products.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grid de produtos */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Frown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {search ? 'Nenhum produto encontrado para essa busca' : 'Esta loja ainda não tem produtos'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map(p => (
              <ProductCard key={p.id} product={p} storeSlug={store.slug} themeColor={theme} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <StoreIcon className="w-4 h-4" />
            {store.name} · Vitrine em VaiConecta
          </div>
          <Link to="/" className="text-slate-400 hover:text-white text-xs">
            Ver outras lojas →
          </Link>
        </div>
      </footer>
    </div>
  );
}
