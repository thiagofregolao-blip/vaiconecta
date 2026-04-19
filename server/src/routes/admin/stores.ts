import { Router, Request, Response } from 'express';
import { SubscriptionStatus } from '@prisma/client';
import prisma from '../../lib/prisma';

const router = Router();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = base || 'loja';
  let i = 1;
  while (true) {
    const existing = await prisma.store.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    i++;
    slug = `${base}-${i}`;
  }
}

// Lista todas as lojas (super admin)
router.get('/', async (_req: Request, res: Response) => {
  const stores = await prisma.store.findMany({
    include: {
      admins: { select: { id: true, username: true, name: true, email: true } },
      accessPoints: true,
      _count: { select: { products: true } },
    },
    orderBy: [{ isPremium: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(stores);
});

// Criar loja
router.post('/', async (req: Request, res: Response) => {
  const {
    name, slug, commissionPct, logoUrl, bannerUrl, themeColor, bannerGradient,
    descricao, whatsapp, instagram, email, endereco, cidade,
    isPremium, isActive, subscriptionStatus,
  } = req.body;

  if (!name) {
    res.status(400).json({ error: 'name é obrigatório' });
    return;
  }

  const finalSlug = await uniqueSlug(slug ? slugify(slug) : slugify(name));

  const store = await prisma.store.create({
    data: {
      name,
      slug: finalSlug,
      commissionPct: Number(commissionPct) || 10,
      logoUrl, bannerUrl, themeColor, bannerGradient,
      descricao, whatsapp, instagram, email, endereco, cidade,
      isPremium: !!isPremium,
      isActive: isActive !== false,
      subscriptionStatus: (subscriptionStatus as SubscriptionStatus) || 'TRIAL',
    },
  });
  res.status(201).json(store);
});

// Atualizar loja
router.put('/:id', async (req: Request, res: Response) => {
  const body = req.body;
  const data: Record<string, unknown> = {};

  const fields = [
    'name', 'logoUrl', 'bannerUrl', 'themeColor', 'bannerGradient',
    'descricao', 'whatsapp', 'instagram', 'email', 'endereco', 'cidade',
    'isPremium', 'isActive',
  ];
  for (const f of fields) if (f in body) data[f] = body[f];

  if (body.commissionPct !== undefined) data.commissionPct = Number(body.commissionPct);
  if (body.subscriptionStatus) data.subscriptionStatus = body.subscriptionStatus;
  if (body.subscriptionExpiresAt !== undefined) {
    data.subscriptionExpiresAt = body.subscriptionExpiresAt ? new Date(body.subscriptionExpiresAt) : null;
  }
  if (body.slug) {
    data.slug = await uniqueSlug(slugify(body.slug), req.params.id);
  }

  const store = await prisma.store.update({ where: { id: req.params.id }, data });
  res.json(store);
});

// Deletar loja
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.store.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Adicionar AP à loja
router.post('/:id/aps', async (req: Request, res: Response) => {
  const { name, apMac } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name é obrigatório' });
    return;
  }
  const ap = await prisma.accessPoint.create({
    data: { name, apMac: apMac || null, storeId: req.params.id },
  });
  res.status(201).json(ap);
});

// Remover AP
router.delete('/:id/aps/:apId', async (req: Request, res: Response) => {
  await prisma.accessPoint.delete({ where: { id: req.params.apId } });
  res.json({ success: true });
});

// Dashboard da loja (para store admin) — mantém a lógica de receita/comissão
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const storeId = req.params.id;

  if (admin.role === 'STORE_ADMIN' && admin.storeId !== storeId) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { accessPoints: true, _count: { select: { products: true } } },
  });

  if (!store) {
    res.status(404).json({ error: 'Loja não encontrada' });
    return;
  }

  const apMacs = store.accessPoints.map((ap) => ap.apMac).filter(Boolean) as string[];

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const mesInicio = new Date();
  mesInicio.setDate(1);
  mesInicio.setHours(0, 0, 0, 0);

  const whereAp = apMacs.length > 0 ? { apMac: { in: apMacs } } : { id: 'none' };

  const [totalHoje, totalMes, pagamentosRecentes] = await Promise.all([
    prisma.payment.count({ where: { ...whereAp, status: { in: ['ACTIVE', 'APPROVED'] }, createdAt: { gte: hoje } } }),
    prisma.payment.count({ where: { ...whereAp, status: { in: ['ACTIVE', 'APPROVED'] }, createdAt: { gte: mesInicio } } }),
    prisma.payment.findMany({
      where: { ...whereAp, status: { in: ['ACTIVE', 'APPROVED'] } },
      include: { plan: { select: { name: true, price: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const receitaResult = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(p.price), 0) as total
    FROM "Payment" pay
    JOIN "Plan" p ON pay."planId" = p.id
    WHERE pay.status IN ('ACTIVE', 'APPROVED')
    AND pay."apMac" = ANY(${apMacs})
  `;

  const receitaTotal = Number(receitaResult[0]?.total ?? 0);
  const comissao = receitaTotal * (store.commissionPct / 100);

  const receitaMesResult = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(p.price), 0) as total
    FROM "Payment" pay
    JOIN "Plan" p ON pay."planId" = p.id
    WHERE pay.status IN ('ACTIVE', 'APPROVED')
    AND pay."apMac" = ANY(${apMacs})
    AND pay."createdAt" >= ${mesInicio}
  `;

  const receitaMes = Number(receitaMesResult[0]?.total ?? 0);

  res.json({
    store: {
      id: store.id, name: store.name, slug: store.slug,
      commissionPct: store.commissionPct,
      isPremium: store.isPremium, isActive: store.isActive,
      subscriptionStatus: store.subscriptionStatus,
    },
    accessPoints: store.accessPoints,
    produtosCount: store._count.products,
    stats: {
      totalHoje,
      totalMes,
      receitaTotal,
      receitaMes,
      comissaoTotal: comissao,
      comissaoMes: receitaMes * (store.commissionPct / 100),
    },
    pagamentosRecentes,
  });
});

export default router;
