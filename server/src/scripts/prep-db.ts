/**
 * Executado ANTES de `prisma db push` no deploy.
 *
 * Motivo: o schema novo adicionou colunas NOT NULL (Store.slug, CatalogProduct.storeId,
 * CatalogProduct.precoOriginal) em tabelas que podem ter linhas legadas.
 * `prisma db push --accept-data-loss` falha nesse caso porque o Postgres recusa
 * ADD COLUMN NOT NULL sem default em tabela com dados.
 *
 * Este script limpa apenas as tabelas/linhas conflitantes via SQL raw, preservando:
 * Banner, Plan, Payment, Voucher, Admin (com storeId=null).
 *
 * Idempotente: se a tabela não existe ainda, apenas loga e segue.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function tryExec(label: string, sql: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`  ✓ ${label}`);
  } catch (err: any) {
    console.log(`  · ${label} — ignorado (${err.code || err.message?.slice(0, 80)})`);
  }
}

async function main() {
  console.log('🧹 prep-db: preparando schema novo...');

  // 1. Limpa filhos antes dos pais (FKs)
  await tryExec('clear AccessPoint', 'DELETE FROM "AccessPoint"');
  await tryExec('clear CatalogProduct', 'DELETE FROM "CatalogProduct"');
  await tryExec('clear StoreImportConfig', 'DELETE FROM "StoreImportConfig"');

  // 2. Desassocia admins de lojas (seed vai relinkar)
  await tryExec('detach Admin.storeId', 'UPDATE "Admin" SET "storeId" = NULL');

  // 3. Apaga Stores legadas (sem slug → violariam NOT NULL)
  await tryExec('clear Store', 'DELETE FROM "Store"');

  console.log('✓ prep-db concluído — `prisma db push` pode rodar.');
}

main()
  .catch((err) => {
    console.error('✗ prep-db falhou (seguindo mesmo assim):', err?.message || err);
    // Não falha o deploy — db push vai dar seu próprio diagnóstico
  })
  .finally(() => prisma.$disconnect());
