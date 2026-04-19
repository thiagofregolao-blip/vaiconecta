import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getCurrentRates } from '../services/exchange.service';

const router = Router();

// GET /api/public/stores — lojas ativas com alguns produtos pra home
router.get('/stores', async (_req: Request, res: Response) => {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: [{ isPremium: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      bannerUrl: true,
      themeColor: true,
      bannerGradient: true,
      descricao: true,
      isPremium: true,
      cidade: true,
      _count: { select: { products: { where: { ativo: true } } } },
      products: {
        where: { ativo: true },
        orderBy: [{ destaque: 'desc' }, { ordem: 'asc' }, { createdAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          nome: true,
          imagemUrl: true,
          precoBrl: true,
          precoUsd: true,
          precoGs: true,
          moedaOriginal: true,
          precoOriginal: true,
          categoria: true,
        },
      },
    },
  });

  res.json(stores.map(s => ({
    ...s,
    productCount: s._count.products,
    _count: undefined,
  })));
});

// GET /api/public/stores/:slug — detalhes públicos de uma loja
router.get('/stores/:slug', async (req: Request, res: Response) => {
  const store = await prisma.store.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true, slug: true, name: true, logoUrl: true, bannerUrl: true,
      themeColor: true, bannerGradient: true, descricao: true,
      whatsapp: true, instagram: true, email: true,
      endereco: true, cidade: true, isPremium: true, isActive: true,
    },
  });

  if (!store || !store.isActive) {
    res.status(404).json({ error: 'Loja não encontrada' });
    return;
  }

  res.json(store);
});

// GET /api/public/stores/:slug/products — produtos de uma loja
router.get('/stores/:slug/products', async (req: Request, res: Response) => {
  const { search, categoria, sort } = req.query;

  const store = await prisma.store.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, isActive: true },
  });

  if (!store || !store.isActive) {
    res.status(404).json({ error: 'Loja não encontrada' });
    return;
  }

  const orderBy =
    sort === 'price-asc' ? [{ precoBrl: 'asc' as const }] :
    sort === 'price-desc' ? [{ precoBrl: 'desc' as const }] :
    sort === 'name' ? [{ nome: 'asc' as const }] :
    [{ destaque: 'desc' as const }, { ordem: 'asc' as const }, { createdAt: 'desc' as const }];

  const products = await prisma.catalogProduct.findMany({
    where: {
      storeId: store.id,
      ativo: true,
      ...(search && { nome: { contains: String(search), mode: 'insensitive' as const } }),
      ...(categoria && { categoria: String(categoria) }),
    },
    orderBy,
  });

  res.json(products);
});

// GET /api/public/products/:id — detalhe de um produto (inclui store)
router.get('/products/:id', async (req: Request, res: Response) => {
  const product = await prisma.catalogProduct.findUnique({
    where: { id: req.params.id },
    include: {
      store: {
        select: {
          id: true, slug: true, name: true, logoUrl: true,
          themeColor: true, bannerGradient: true,
          whatsapp: true, instagram: true, cidade: true,
        },
      },
    },
  });

  if (!product || !product.ativo) {
    res.status(404).json({ error: 'Produto não encontrado' });
    return;
  }

  res.json(product);
});

// GET /api/public/exchange-rates — cotação atual pra exibir na UI
router.get('/exchange-rates', async (_req: Request, res: Response) => {
  try {
    const rates = await getCurrentRates();
    res.json(rates);
  } catch (err: any) {
    res.status(503).json({ error: 'Cotação indisponível', detail: err.message });
  }
});

// GET /api/public/categories — lista categorias de todas as lojas ativas
router.get('/categories', async (_req: Request, res: Response) => {
  const result = await prisma.catalogProduct.groupBy({
    by: ['categoria'],
    where: { ativo: true, categoria: { not: null }, store: { isActive: true } },
    _count: true,
    orderBy: { _count: { categoria: 'desc' } },
  });

  res.json(
    result
      .filter(r => r.categoria)
      .map(r => ({ categoria: r.categoria, count: r._count }))
  );
});

export default router;
