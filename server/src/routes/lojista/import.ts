import { Router, Request, Response } from 'express';
import axios from 'axios';
import { Currency } from '@prisma/client';
import prisma from '../../lib/prisma';
import { getStoreId } from '../../middleware/lojistaAuth';
import { computeAllPrices } from '../../services/exchange.service';

const router = Router();

// Resolve caminho aninhado (ex: "data.products.items")
function resolvePath(obj: any, path: string | null | undefined): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

// Extrai valor de um item usando o fieldMapping (nosso_campo -> campo_cliente)
function extract(item: any, clientField: string | undefined): any {
  if (!clientField) return undefined;
  return resolvePath(item, clientField);
}

function parseNum(val: any): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  const clean = String(val).replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? undefined : n;
}

function parseMoeda(val: any): Currency {
  const s = String(val || '').toUpperCase().trim();
  if (s === 'USD' || s === 'US$' || s === 'DOLAR' || s === 'DÓLAR') return 'USD';
  if (s === 'PYG' || s === 'GS' || s === 'GUARANI' || s === 'G$') return 'PYG';
  return 'BRL';
}

// GET /api/lojista/import/config — lê config atual
router.get('/config', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const config = await prisma.storeImportConfig.findUnique({ where: { storeId } });
  res.json(config);
});

// PUT /api/lojista/import/config — salva/atualiza config
router.put('/config', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const {
    apiUrl, apiMethod, apiHeaders, fieldMapping, rootPath,
    autoSyncEnabled, syncIntervalHours,
  } = req.body;

  if (!apiUrl) {
    res.status(400).json({ error: 'apiUrl é obrigatório' });
    return;
  }
  if (!fieldMapping || typeof fieldMapping !== 'object') {
    res.status(400).json({ error: 'fieldMapping é obrigatório' });
    return;
  }

  const data = {
    apiUrl,
    apiMethod: apiMethod || 'GET',
    apiHeaders: apiHeaders || null,
    fieldMapping,
    rootPath: rootPath || null,
    autoSyncEnabled: !!autoSyncEnabled,
    syncIntervalHours: Number(syncIntervalHours) || 24,
  };

  const config = await prisma.storeImportConfig.upsert({
    where: { storeId },
    create: { storeId, ...data },
    update: data,
  });

  res.json(config);
});

// POST /api/lojista/import/test — testa a URL + mapeamento sem salvar no DB
router.post('/test', async (req: Request, res: Response) => {
  const { apiUrl, apiMethod, apiHeaders, fieldMapping, rootPath } = req.body;

  if (!apiUrl || !fieldMapping) {
    res.status(400).json({ error: 'apiUrl e fieldMapping obrigatórios' });
    return;
  }

  try {
    const { data } = await axios({
      url: apiUrl,
      method: apiMethod || 'GET',
      headers: apiHeaders || {},
      timeout: 15000,
    });

    const list = resolvePath(data, rootPath);
    if (!Array.isArray(list)) {
      res.status(400).json({
        error: `Resposta não é um array no caminho "${rootPath || 'raiz'}"`,
        sample: typeof data === 'object' ? Object.keys(data).slice(0, 20) : String(data).slice(0, 200),
      });
      return;
    }

    const preview = list.slice(0, 5).map((item: any) => ({
      nome: extract(item, fieldMapping.nome),
      precoOriginal: parseNum(extract(item, fieldMapping.precoOriginal)),
      moedaOriginal: parseMoeda(extract(item, fieldMapping.moedaOriginal)),
      imagemUrl: extract(item, fieldMapping.imagemUrl),
      produtoUrl: extract(item, fieldMapping.produtoUrl),
      categoria: extract(item, fieldMapping.categoria),
      marca: extract(item, fieldMapping.marca),
      externalId: extract(item, fieldMapping.externalId),
    }));

    res.json({
      success: true,
      total: list.length,
      preview,
      sampleKeys: list[0] ? Object.keys(list[0]).slice(0, 30) : [],
    });
  } catch (err: any) {
    res.status(502).json({
      error: err.message || 'Falha ao conectar na URL',
      code: err.code,
      status: err.response?.status,
    });
  }
});

// POST /api/lojista/import/run — executa a importação usando a config salva
router.post('/run', async (req: Request, res: Response) => {
  const storeId = getStoreId(req);
  const { replace } = req.body as { replace?: boolean };

  const config = await prisma.storeImportConfig.findUnique({ where: { storeId } });
  if (!config) {
    res.status(400).json({ error: 'Configure a API antes de executar' });
    return;
  }

  const mapping = config.fieldMapping as Record<string, string>;

  try {
    const { data } = await axios({
      url: config.apiUrl,
      method: config.apiMethod,
      headers: (config.apiHeaders as Record<string, string>) || {},
      timeout: 30000,
    });

    const list = resolvePath(data, config.rootPath);
    if (!Array.isArray(list)) {
      await prisma.storeImportConfig.update({
        where: { storeId },
        data: { lastSyncAt: new Date(), lastSyncStatus: 'error', lastSyncError: 'Resposta não é array' },
      });
      res.status(400).json({ error: 'Resposta não é um array' });
      return;
    }

    if (replace) {
      await prisma.catalogProduct.deleteMany({ where: { storeId, sourceType: 'api' } });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ externalId?: string; error: string }> = [];

    for (const item of list) {
      try {
        const nome = String(extract(item, mapping.nome) || '').trim();
        const imagemUrl = String(extract(item, mapping.imagemUrl) || '').trim();
        const precoOriginal = parseNum(extract(item, mapping.precoOriginal));
        const moedaOriginal = parseMoeda(extract(item, mapping.moedaOriginal));
        const externalId = mapping.externalId ? String(extract(item, mapping.externalId) || '') : null;

        if (!nome || !imagemUrl || !precoOriginal || precoOriginal <= 0) {
          skipped++;
          continue;
        }

        const prices = await computeAllPrices(precoOriginal, moedaOriginal);

        const baseData = {
          nome,
          descricao: extract(item, mapping.descricao) ? String(extract(item, mapping.descricao)) : null,
          categoria: extract(item, mapping.categoria) ? String(extract(item, mapping.categoria)) : null,
          marca: extract(item, mapping.marca) ? String(extract(item, mapping.marca)) : null,
          moedaOriginal,
          precoOriginal,
          precoBrl: prices.precoBrl,
          precoUsd: prices.precoUsd,
          precoGs: prices.precoGs,
          imagemUrl,
          produtoUrl: extract(item, mapping.produtoUrl) ? String(extract(item, mapping.produtoUrl)) : null,
          sourceType: 'api',
        };

        if (externalId) {
          const existing = await prisma.catalogProduct.findUnique({
            where: { storeId_externalId: { storeId, externalId } },
          });
          if (existing) {
            await prisma.catalogProduct.update({
              where: { id: existing.id },
              data: baseData,
            });
            updated++;
          } else {
            await prisma.catalogProduct.create({
              data: { ...baseData, storeId, externalId },
            });
            imported++;
          }
        } else {
          await prisma.catalogProduct.create({ data: { ...baseData, storeId } });
          imported++;
        }
      } catch (e: any) {
        errors.push({ externalId: String(extract(item, mapping.externalId) || ''), error: e.message });
      }
    }

    await prisma.storeImportConfig.update({
      where: { storeId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      },
    });

    res.json({ imported, updated, skipped, total: list.length, errors });
  } catch (err: any) {
    await prisma.storeImportConfig.update({
      where: { storeId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncError: err.message || 'Falha desconhecida',
      },
    });
    res.status(502).json({ error: err.message || 'Falha ao importar' });
  }
});

export default router;
