# SIPAT Photo Drive — Implementation Plan

> **For agentic workers:** execute task by task (native, in-session). Steps use checkboxes.

**Goal:** Plataforma real de fotos de eventos SIPAT: QR Code → câmera → upload → galeria compartilhada + painel admin.

**Architecture:** Um único serviço Express (TypeScript) expõe `/api/*` e serve o build do React (Vite). PostgreSQL (Supabase) via Prisma 7 + adapter-pg; fotos em bucket privado do Supabase Storage (driver `local` em disco só para dev/teste), entregues por URL assinada. Admin com JWT em cookie httpOnly.

**Tech Stack:** React 18, Vite, TS, Tailwind 3, lucide-react; Express 4, Prisma 7, pg, zod, bcryptjs, jsonwebtoken, multer, sharp, qrcode, archiver, helmet, express-rate-limit, @supabase/supabase-js; vitest + supertest + embedded-postgres (testes).

**Spec:** pedido original do usuário (SIPAT Photo Drive), seções 1–13.

## Global Constraints
- Cores: #168447, #105C35, #E8F5EC, #FFFFFF, #F5F7F5, #333333. Texto da UI em português (pt-BR).
- Título: "SIPAT – Compartilhe seus momentos"; botões "Acessar galeria" e "Enviar minhas fotos".
- Sem login para participantes; QR com token aleatório (24 bytes, base64url).
- Imagens nunca em Base64 no banco; só metadados + `file_path`.
- Sem mocks, sem botões inertes; contatos do rodapé vêm de `settings` (placeholders).
- Tabelas: users, events, albums, photos, uploads (+ settings).

## Review Focus
- Arquivo com extensão .jpg mas conteúdo não-imagem → 400 (valida magic bytes com sharp).
- Upload em evento desativado ou token inexistente → 403/404 sem gravar nada.
- Foto maior que o limite (15 MB) ou mais de 20 arquivos por envio → 413/400.
- Rotas admin sem cookie/JWT inválido → 401; participante nunca lista/baixa fotos de outro evento.
- Excluir foto remove também o arquivo do storage (sem órfãos).

## Tarefas
1. **Servidor base + schema:** `server/` (env, prisma schema, `migrations/0001_init.sql`, runner `migrate`, seed admin). Teste: migrate cria 6 tabelas.
2. **Storage:** `storage/{index,local,supabase}.ts` com `put/remove/signedUrl/read`. Teste: ciclo put→signedUrl→read→remove no driver local.
3. **Auth + middlewares:** login/logout/me, `requireAdmin`, rate limit, helmet, erro centralizado. Teste: 401 sem cookie, login ok.
4. **Eventos/álbuns/settings/dashboard (admin):** CRUD, QR PNG, regenerar token, dashboard. Teste: CRUD + QR PNG válido.
5. **Upload público + galeria + ZIP:** `/api/public/events/:token`, upload multi-arquivo, listagem paginada, download, ZIP, exclusão. Teste: fluxo completo e Review Focus.
6. **Frontend:** Home, Upload (`/e/:token`), Galeria (`/galeria`, `/galeria/:token`), Admin (login, dashboard, eventos, evento/álbuns/fotos, configurações), Footer.
7. **Verificação e entrega:** build, testes, `.env.example`, README, `render.yaml`, instruções Supabase.
