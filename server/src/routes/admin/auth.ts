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

export default router;
