import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não informado' });
    return;
  }
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}
