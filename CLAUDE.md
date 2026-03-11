# VaiConecta — Instruções para Claude Code

## O que é o projeto
SaaS de Captive Portal Wi-Fi pago. O cliente conecta no Wi-Fi ou acessa www.vaiconecta.com.br,
escolhe um plano, paga via Pix, e o MikroTik libera o acesso automaticamente.

## Stack
- **Backend**: Node.js + TypeScript + Express + Prisma ORM + PostgreSQL (Railway)
- **Frontend**: React + Vite + Tailwind CSS (Glassmorphism / Dark Mode)
- **Pagamentos**: Mercado Pago SDK v2 (Pix - Checkout Transparente)
- **Hardware**: MikroTik CCR2004 (API REST RouterOS v7) + 18x Ubiquiti U7 Pro Outdoor
- **Infra**: Railway (deploy), WireGuard (túnel seguro para API MikroTik)

## Estrutura do Monorepo
```
/client   → React frontend (Landing Page + Admin Dashboard)
/server   → Express backend (API + Webhooks)
/prisma   → Schema e migrations
/infra    → Configs WireGuard, notas MikroTik
```

## GET-SHIT-DONE — Fluxo de Trabalho
```
[Analisar] → [Planejar] → [Executar] → [Verificar]
```
- **Leia antes de editar.** Nunca propor mudanças em código não lido.
- **Não over-engineer.** Mínimo necessário. Três linhas similares > abstração prematura.
- **Sem compatibilidade retroativa.** Se não é usado, delete.
- **Uma tarefa por vez.** Marcar como concluída antes de começar a próxima.

## UI-UX-PRO-MAX — Padrões de Interface
- Layout Enterprise Adaptável: imersivo no desktop, fluido no mobile
- Glassmorphism: `bg-white/10 backdrop-blur-md border border-white/20`
- Dark background: `from-slate-900 via-slate-800 to-blue-950`
- Touch targets mínimo 44×44px
- Skeleton screens em carregamento
- Feedback visual em tempo real (status do Pix, liberação de acesso)
- Ícones: lucide-react (nunca emojis como ícones)
- Cor primária: azul `#3b82f6` (blue-500)

## Modelo de Negócio
- Planos criados APENAS pelo admin no painel
- Cada plano define: nome, preço, horas de duração, max dispositivos simultâneos
- Tempo corrido: começa no primeiro uso, não na compra
- Vouchers manuais para cortesias

## Fluxo de Pagamento
1. Cliente seleciona plano → informa email → sistema cria pagamento MP
2. Frontend exibe QR Code Pix → polling a cada 2s no status
3. MP webhook `POST /webhook/mercadopago` confirma aprovação
4. Backend chama MikroTik API → cria usuário Hotspot com `limit-uptime`
5. Frontend detecta aprovação → mostra tela de sucesso

## MikroTik API (RouterOS v7 REST)
- Base URL: `https://${MIKROTIK_HOST}/rest/`
- Auth: HTTP Basic (MIKROTIK_USER / MIKROTIK_PASS)
- Criar usuário hotspot: `PUT /rest/ip/hotspot/user`
- Listar sessões ativas: `GET /rest/ip/hotspot/active`
- Remover usuário: `DELETE /rest/ip/hotspot/user/{id}`
- Campo de tempo: `limit-uptime` (ex: "24:00:00")

## Railway (Deploy)
- Script obrigatório no server/package.json: `"start": "node dist/index.js"`
- railway.json na raiz define buildCommand e startCommand
- Variáveis de ambiente: ver server/.env.example
