import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(plans);
});

router.post('/', async (req: Request, res: Response) => {
  const { name, price, hours, maxDevices } = req.body;

  if (!name || price == null || !hours) {
    res.status(400).json({ error: 'name, price e hours são obrigatórios' });
    return;
  }

  const plan = await prisma.plan.create({
    data: { name, price: Number(price), hours: Number(hours), maxDevices: Number(maxDevices) || 1 },
  });
  res.status(201).json(plan);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { name, price, hours, maxDevices, active } = req.body;

  const plan = await prisma.plan.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: Number(price) }),
      ...(hours !== undefined && { hours: Number(hours) }),
      ...(maxDevices !== undefined && { maxDevices: Number(maxDevices) }),
      ...(active !== undefined && { active: Boolean(active) }),
    },
  });
  res.json(plan);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.plan.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.json({ success: true });
});

export default router;
