import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../../lib/prisma';

const router = Router();

const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  },
});

// GET /api/admin/banners — lista todos (auth)
router.get('/', async (_req: Request, res: Response) => {
  const banners = await prisma.banner.findMany({ orderBy: { order: 'asc' } });
  res.json(banners);
});

// GET /api/banners — lista ativos para a landing page (público)
// (registrado no index.ts separado)

// POST /api/admin/banners — cria com upload de imagem
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  const { title, link, order } = req.body;
  if (!title) { res.status(400).json({ error: 'Título obrigatório' }); return; }
  if (!req.file) { res.status(400).json({ error: 'Imagem obrigatória' }); return; }

  const imageUrl = `/uploads/${req.file.filename}`;
  const banner = await prisma.banner.create({
    data: { title, imageUrl, link: link || null, order: order ? Number(order) : 0 },
  });
  res.status(201).json(banner);
});

// PUT /api/admin/banners/:id — atualiza (opcionalmente troca imagem)
router.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  const { title, link, order, active } = req.body;

  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Banner não encontrado' }); return; }

  let imageUrl = existing.imageUrl;
  if (req.file) {
    // Remove imagem antiga
    const oldPath = path.join(uploadsDir, path.basename(existing.imageUrl));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    imageUrl = `/uploads/${req.file.filename}`;
  }

  const banner = await prisma.banner.update({
    where: { id: req.params.id },
    data: {
      title: title ?? existing.title,
      imageUrl,
      link: link !== undefined ? (link || null) : existing.link,
      order: order !== undefined ? Number(order) : existing.order,
      active: active !== undefined ? active === 'true' || active === true : existing.active,
    },
  });
  res.json(banner);
});

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ error: 'Banner não encontrado' }); return; }

  const oldPath = path.join(uploadsDir, path.basename(existing.imageUrl));
  if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

  await prisma.banner.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
