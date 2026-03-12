import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/admin/banners
router.get('/', async (_req: Request, res: Response) => {
  const banners = await prisma.banner.findMany({ orderBy: { order: 'asc' } });
  res.json(banners);
});

// POST /api/admin/banners — { title, imageUrl (base64 data URL), link?, order? }
router.post('/', async (req: Request, res: Response) => {
  const { title, imageUrl, link, order } = req.body;
  if (!title)    { res.status(400).json({ error: 'Título obrigatório' }); return; }
  if (!imageUrl) { res.status(400).json({ error: 'Imagem obrigatória' }); return; }

  const banner = await prisma.banner.create({
    data: { title, imageUrl, link: link || null, order: order ? Number(order) : 0 },
  });
  res.status(201).json(banner);
});

// PUT /api/admin/banners/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { title, imageUrl, link, order, active } = req.body;

  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Banner não encontrado' }); return; }

  const banner = await prisma.banner.update({
    where: { id: req.params.id },
    data: {
      title:    title    !== undefined ? title    : existing.title,
      imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
      link:     link     !== undefined ? (link || null) : existing.link,
      order:    order    !== undefined ? Number(order) : existing.order,
      active:   active   !== undefined ? (active === true || active === 'true') : existing.active,
    },
  });
  res.json(banner);
});

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Banner não encontrado' }); return; }
  await prisma.banner.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
