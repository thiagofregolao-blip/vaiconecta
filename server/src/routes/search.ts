import { Router, Request, Response } from 'express';

const router = Router();

const N8N_WEBHOOK = 'https://agrofarmdigital.app.n8n.cloud/webhook/vai-de-busca';

router.post('/', async (req: Request, res: Response) => {
  const { query, history } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query obrigatório' });
  }

  try {
    const response = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), history: Array.isArray(history) ? history : [] }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('n8n error:', response.status, text);
      return res.status(502).json({ error: 'Erro ao buscar produtos' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('search error:', err);
    res.status(502).json({ error: 'Timeout ou erro de conexão' });
  }
});

export default router;
