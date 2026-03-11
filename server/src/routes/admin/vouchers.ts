import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { randomBytes } from 'crypto';

const router = Router();

function gerarCodigo(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

router.get('/', async (_req: Request, res: Response) => {
  const vouchers = await prisma.voucher.findMany({
    include: { plan: { select: { name: true, hours: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(vouchers);
});

router.post('/', async (req: Request, res: Response) => {
  const { planId, quantity = 1, createdBy } = req.body;

  if (!planId || !createdBy) {
    res.status(400).json({ error: 'planId e createdBy são obrigatórios' });
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    res.status(404).json({ error: 'Plano não encontrado' });
    return;
  }

  const qty = Math.min(Number(quantity), 100);
  const codes: string[] = [];

  for (let i = 0; i < qty; i++) {
    let code = gerarCodigo();
    // Garantir unicidade
    while (await prisma.voucher.findUnique({ where: { code } })) {
      code = gerarCodigo();
    }
    codes.push(code);
  }

  const vouchers = await prisma.voucher.createMany({
    data: codes.map((code) => ({ planId, code, createdBy })),
  });

  const created = await prisma.voucher.findMany({
    where: { code: { in: codes } },
    include: { plan: { select: { name: true } } },
  });

  res.status(201).json(created);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const voucher = await prisma.voucher.findUnique({ where: { id: req.params.id } });
  if (!voucher || voucher.usedBy) {
    res.status(400).json({ error: 'Voucher não encontrado ou já utilizado' });
    return;
  }
  await prisma.voucher.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
