import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/admin/catalog/import — recebe array de produtos do frontend
router.post('/import', async (req: Request, res: Response) => {
  const { products, replace } = req.body as {
    products: Array<{
      nome: string;
      precoGs?: number;
      precoUsd?: number;
      precoBrl?: number;
      imagemUrl: string;
      produtoUrl: string;
      loja?: string;
    }>;
    replace?: boolean;
  };

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'products array obrigatório' });
  }

  if (replace) {
    await prisma.catalogProduct.deleteMany({});
  }

  const created = await prisma.catalogProduct.createMany({
    data: products.map(p => ({
      nome: p.nome,
      precoGs: p.precoGs ?? null,
      precoUsd: p.precoUsd ?? null,
      precoBrl: p.precoBrl ?? null,
      imagemUrl: p.imagemUrl,
      produtoUrl: p.produtoUrl,
      loja: p.loja || 'LG Importados',
    })),
    skipDuplicates: false,
  });

  res.json({ imported: created.count });
});

// GET /api/admin/catalog — lista todos os produtos
router.get('/', async (_req: Request, res: Response) => {
  const products = await prisma.catalogProduct.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

// DELETE /api/admin/catalog — limpa catálogo
router.delete('/', async (_req: Request, res: Response) => {
  const { count } = await prisma.catalogProduct.deleteMany({});
  res.json({ deleted: count });
});

export default router;
