import { Router, Request, Response } from 'express';
import { Currency } from '@prisma/client';
import prisma from '../../lib/prisma';
import { computeAllPrices } from '../../services/exchange.service';

const router = Router();

// GET /api/admin/catalog — lista produtos (super admin vê todos, store admin vê só os seus)
router.get('/', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const storeIdFilter = req.query.storeId as string | undefined;

  const where: Record<string, unknown> = {};
  if (admin.role === 'STORE_ADMIN') {
    where.storeId = admin.storeId;
  } else if (storeIdFilter) {
    where.storeId = storeIdFilter;
  }

  const products = await prisma.catalogProduct.findMany({
    where,
    include: {
      store: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json(products);
});

// POST /api/admin/catalog/import — super admin importa pra uma loja específica
router.post('/import', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { products, replace, storeId: bodyStoreId } = req.body as {
    products: Array<{
      nome: string;
      moedaOriginal?: Currency;
      precoOriginal?: number;
      precoGs?: number;
      precoUsd?: number;
      precoBrl?: number;
      imagemUrl: string;
      produtoUrl?: string;
      categoria?: string;
      marca?: string;
    }>;
    replace?: boolean;
    storeId?: string;
  };

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400).json({ error: 'products array obrigatório' });
    return;
  }

  // Se STORE_ADMIN, força a própria loja. Se SUPER_ADMIN, exige storeId no body.
  const storeId = admin.role === 'STORE_ADMIN' ? admin.storeId : bodyStoreId;
  if (!storeId) {
    res.status(400).json({ error: 'storeId é obrigatório (super admin deve informar a loja)' });
    return;
  }

  if (replace) {
    await prisma.catalogProduct.deleteMany({ where: { storeId } });
  }

  let imported = 0;
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      if (!p.nome?.trim() || !p.imagemUrl?.trim()) {
        errors.push({ index: i, error: 'nome e imagemUrl são obrigatórios' });
        continue;
      }

      // Se vier com preços nas 3 moedas, usa direto e define moeda original por prioridade BRL>USD>PYG
      let moedaOriginal: Currency = p.moedaOriginal || 'BRL';
      let precoOriginal = p.precoOriginal ?? 0;
      let precoBrl = p.precoBrl ?? null;
      let precoUsd = p.precoUsd ?? null;
      let precoGs = p.precoGs ?? null;

      if (!precoOriginal) {
        if (precoBrl) { moedaOriginal = 'BRL'; precoOriginal = precoBrl; }
        else if (precoUsd) { moedaOriginal = 'USD'; precoOriginal = precoUsd; }
        else if (precoGs) { moedaOriginal = 'PYG'; precoOriginal = precoGs; }
        else {
          errors.push({ index: i, error: 'nenhum preço informado' });
          continue;
        }
      }

      // Recalcula moedas faltantes a partir da original
      if (!precoBrl || !precoUsd || !precoGs) {
        const calc = await computeAllPrices(precoOriginal, moedaOriginal);
        precoBrl = precoBrl ?? calc.precoBrl;
        precoUsd = precoUsd ?? calc.precoUsd;
        precoGs = precoGs ?? calc.precoGs;
      }

      await prisma.catalogProduct.create({
        data: {
          storeId,
          nome: p.nome.trim(),
          categoria: p.categoria,
          marca: p.marca,
          moedaOriginal,
          precoOriginal,
          precoBrl, precoUsd, precoGs,
          imagemUrl: p.imagemUrl,
          produtoUrl: p.produtoUrl || null,
          sourceType: 'excel',
        },
      });
      imported++;
    } catch (e: any) {
      errors.push({ index: i, error: e.message || 'erro ao salvar' });
    }
  }

  res.json({ imported, errors });
});

// DELETE /api/admin/catalog — limpa catálogo (super admin: da loja query; store admin: da própria)
router.delete('/', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const storeIdFilter = req.query.storeId as string | undefined;

  const where: Record<string, unknown> = {};
  if (admin.role === 'STORE_ADMIN') {
    where.storeId = admin.storeId;
  } else if (storeIdFilter) {
    where.storeId = storeIdFilter;
  } else {
    res.status(400).json({ error: 'super admin deve informar storeId na query' });
    return;
  }

  const { count } = await prisma.catalogProduct.deleteMany({ where });
  res.json({ deleted: count });
});

export default router;
