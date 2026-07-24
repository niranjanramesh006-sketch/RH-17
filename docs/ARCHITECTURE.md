# UniAssist AI — Architecture Decisions (v2)

This document records the architectural direction for the rebuild. It exists
so every later milestone builds toward the same target instead of drifting.

## 1. Problem Being Solved

Organizations need AI assistants scoped to their own domain and documents,
with strict data isolation between tenants, without needing an ML team to
build the underlying infrastructure (RAG, auth, memory, admin tooling).

## 2. Core Design Decisions

| Concern | Decision | Why |
|---|---|---|
| Backend framework | FastAPI (async, Python 3.12) | Async-native, typed, fast to iterate |
| Primary datastore | PostgreSQL | Relational integrity + JSON columns where needed |
| Vector storage | `pgvector` extension on the same Postgres instance | Persistent by default (survives restarts), no separate vector DB to operate, one connection pool to manage |
| Tenant isolation | Postgres Row-Level Security (RLS) policies on `tenant_id`, enforced at the database layer | App-layer filtering can be forgotten in a new query; RLS cannot be bypassed by a missing `WHERE` clause |
| Background jobs | Redis + a worker process (RQ/Celery) | Reminders/emails survive process restarts; horizontally scalable, unlike in-process schedulers |
| Realtime chat | Server-Sent Events (SSE) | Token-by-token streaming without the operational overhead of WebSockets for a one-directional stream |
| Auth | JWT access + refresh tokens, bcrypt password hashing | Standard, stateless, refresh flow avoids forcing re-login |
| Frontend framework | React 18 + TypeScript + Vite | Fast dev loop, strict typing end-to-end |
| Frontend state | TanStack Query (server state) + Zustand (UI state) | Clear separation of concerns; avoids Redux boilerplate |
| Styling | Tailwind CSS | Consistent design tokens, fast iteration |
| Containerization | Docker + Docker Compose (local), single-container images per service (prod) | Reproducible environments |

## 3. Domain Module System

Each vertical (Healthcare, Education, HR, Support, Sales, General) is defined
as a self-contained **domain package**: a system prompt template, an allowed-
topic classifier, a refusal message, and an accent color — registered in a
domain registry rather than branched with `if/else` in application code. This
keeps adding a 7th domain a matter of adding a package, not editing core logic.

## 4. Tenant Isolation Model

Three independent layers, so a bug in one cannot collapse isolation:

1. **Auth layer** — JWT payload carries `tenant_id`; middleware rejects any
   request whose token tenant doesn't match the requested resource's tenant.
2. **Database layer** — Postgres RLS policies scope every row-level query to
   the session's `tenant_id`, enforced by Postgres itself, not application code.
3. **Vector layer** — `pgvector` rows carry `tenant_id` as an indexed column
   with the same RLS policy applied, so embeddings can never leak cross-tenant
   even via a raw SQL mistake.

## 5. RAG Pipeline (planned, built in the AI Module milestone)

```
Document uploaded
      │
      ├── Digital PDF → direct text extraction
      └── Scanned PDF → OCR fallback
              │
              ▼
      Chunk (with overlap) → Embed → Store in pgvector, tagged tenant_id
              │
              ▼
      Query → similarity search (tenant-scoped) → top-k chunks → LLM prompt
```

## 6. Non-Goals for This Rebuild

- No code, config, or literal architecture reused from the reference project.
- No feature-for-feature clone — modules are re-derived from the problem
  statement, not from the reference implementation's file layout.

## 7. Milestone Roadmap

See project README "Quick Links" and commit history for live progress against:
Init → Frontend Setup → Backend Setup → Auth → Database → Dashboard →
AI Module → File Upload → Knowledge Base → Admin Panel → Security →
Testing → Deployment → Documentation.
