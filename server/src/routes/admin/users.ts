import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';

const router = Router();

// Listar usuários (apenas super admin)
router.get('/', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  if (admin.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Apenas super admin pode listar usuários' });
    return;
  }
  const users = await prisma.admin.findMany({
    select: { id: true, username: true, name: true, email: true, role: true, storeId: true, createdAt: true,
      store: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// Criar usuário (apenas super admin)
router.post('/', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  if (admin.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Apenas super admin pode criar usuários' });
    return;
  }

  const { username, password, name, email, role, storeId } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'username e password são obrigatórios' });
    return;
  }

  if (role === 'STORE_ADMIN' && !storeId) {
    res.status(400).json({ error: 'storeId é obrigatório para admin de loja' });
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'Username já existe' });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.admin.create({
    data: {
      username,
      password: hashed,
      name: name || null,
      email: email || null,
      role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'STORE_ADMIN',
      storeId: storeId || null,
    },
    select: { id: true, username: true, name: true, email: true, role: true, storeId: true, createdAt: true,
      store: { select: { id: true, name: true } } },
  });

  res.status(201).json(user);
});

// Atualizar usuário
router.put('/:id', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  if (admin.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Apenas super admin pode editar usuários' });
    return;
  }

  const { name, email, password, storeId } = req.body;
  const data: any = {};

  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email || null;
  if (storeId !== undefined) data.storeId = storeId || null;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.admin.update({
    where: { id: req.params.id },
    data,
    select: { id: true, username: true, name: true, email: true, role: true, storeId: true,
      store: { select: { id: true, name: true } } },
  });
  res.json(user);
});

// Deletar usuário
router.delete('/:id', async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  if (admin.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Apenas super admin pode deletar usuários' });
    return;
  }
  if (req.params.id === admin.adminId) {
    res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    return;
  }
  await prisma.admin.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
