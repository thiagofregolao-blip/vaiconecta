import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { getStoreId } from '../../middleware/lojistaAuth';

const router = Router();

// Campos que o lojista pode editar da própria loja
const EDITABLE_FIELDS = [
  'name', 'logoUrl', 'bannerUrl', 'themeColor', 'bannerGradient',
  'descricao', 'whatsapp', 'instagram', 'email', 'endereco', 'cidade',
] as const;

// GET /api/lojista/store — dados da minha loja
router.get('/', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      _count: { select: { products: true } },
    },
  });
  if (!store) {
    res.status(404).json({ error: 'Loja não encontrada' });
    return;
  }
  res.json(store);
});

// PUT /api/lojista/store — atualizar branding/contato da loja
router.put('/', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const data: Record<string, unknown> = {};

  for (const key of EDITABLE_FIELDS) {
    if (key in req.body) data[key] = req.body[key];
  }

  // Slug só super_admin pode mudar — lojista não toca
  // isActive, isPremium, subscriptionStatus idem

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'Nenhum campo para atualizar' });
    return;
  }

  const updated = await prisma.store.update({
    where: { id: storeId },
    data,
  });

  res.json(updated);
});

// GET /api/lojista/store/stats — estatísticas da loja
router.get('/stats', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);

  const [total, ativos, destaque, ultimaImport] = await Promise.all([
    prisma.catalogProduct.count({ where: { storeId } }),
    prisma.catalogProduct.count({ where: { storeId, ativo: true } }),
    prisma.catalogProduct.count({ where: { storeId, destaque: true } }),
    prisma.catalogProduct.findFirst({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, sourceType: true },
    }),
  ]);

  res.json({
    produtos: { total, ativos, inativos: total - ativos, destaque },
    ultimaImport,
  });
});

export default router;
