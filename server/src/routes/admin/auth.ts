import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username e password são obrigatórios' });
    return;
  }

  const admin = await prisma.admin.findUnique({
    where: { username },
    include: { store: { select: { id: true, name: true } } },
  });

  if (!admin) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const token = jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role, storeId: admin.storeId },
    process.env.JWT_SECRET!,
    { expiresIn: '12h' }
  );

  res.json({ token, username: admin.username, name: admin.name, role: admin.role, store: admin.store });
});

// Cadastro — funciona sempre (super admin pode criar outros via /users)
router.post('/register', async (req: Request, res: Response) => {
  const { username, password, name, role } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username e password são obrigatórios' });
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'Usuário já existe' });
    return;
  }

  // Primeiro cadastro sempre vira SUPER_ADMIN
  const totalAdmins = await prisma.admin.count();
  const finalRole = totalAdmins === 0 ? 'SUPER_ADMIN' : (role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'STORE_ADMIN');

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({
    data: { username, name: name || username, password: hashed, role: finalRole },
    include: { store: { select: { id: true, name: true } } },
  });

  const token = jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role, storeId: admin.storeId },
    process.env.JWT_SECRET!,
    { expiresIn: '12h' }
  );

  res.status(201).json({ token, username: admin.username, name: admin.name, role: admin.role, store: admin.store });
});

export default router;
