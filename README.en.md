# MyWayClass

<p align="left">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot" />
</p>

[한국어 README](./README.md)

MyWayClass is an LMS platform that restructures lectures into personalized short-form learning flows.  
It helps learners focus on the exact part they need while giving instructors and operators tools to repurpose and manage lecture content.

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Core Features](#core-features)
- [Workflow](#workflow)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Screens](#key-screens)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [CI Operations](#ci-operations)
- [Docs](#docs)
- [Design Principles](#design-principles)

## Overview

The goal is simple: let users learn from the most important part of a lecture without replaying the entire video.

## Problem Statement

Online lectures often look short and segmented, but the actual useful part is usually only a 2 to 3 minute span.  
In traditional LMS flows, users still need to replay the whole clip and manually search for the right section, which becomes expensive as content grows.

MyWayClass is designed to solve that problem by:

- helping users find only the relevant segment
- restructuring lectures into purpose-driven learning materials
- reducing repetitive review through short-form clips, summaries, quizzes, and Q&A
- creating a reusable content flow for instructors and learners

## Core Features

- Role-based learning experiences (student/instructor/admin)
- Course/lecture/enrollment management and learning dashboard
- STT transcript pipeline, timeline summary, and RAG-based Q&A
- Short-form generation/retry/share/library flows
- AI summary/chat and operational AI logs/insights
- Media upload/processing pipeline and asset mapping

## Workflow

The system is built around lecture fragments rather than a single full-length video.

1. Convert lecture audio to text with STT
2. Chunk the transcript into meaningful segments
3. Use RAG to find evidence segments for a question or learning goal
4. Generate summaries, quizzes, Q&A, and intent classification with AI
5. Connect selected segments into learning-focused short-form clips
6. Keep generated results linked to original lectures for context

## Screenshots

> The repository does not include real capture assets yet, so placeholders are kept.

| Screen | Recommended file name | Description |
|------|------------------------|------|
| Home | `docs/screenshots/home.png` | Public home or landing page |
| Dashboard | `docs/screenshots/dashboard.png` | Learner dashboard |
| Shortform | `docs/screenshots/shortform.png` | Short-form creation and discovery |
| Lecture Studio | `docs/screenshots/lecture-studio.png` | Lecture studio |
| AI Chat | `docs/screenshots/ai-chat.png` | AI chat page |
| Admin | `docs/screenshots/admin.png` | Admin area |

## Tech Stack

| Area | Technology |
|------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend (Primary) | Spring Boot (Java 21), Maven Wrapper |
| Backend (Legacy) | Hono, TypeScript, Cloudflare Workers tooling |
| Shared | Common types and domain logic under `packages/shared` |
| Build/Test | npm workspaces, Vite, Maven, Playwright, Vitest |
| Media | `ffmpeg-static` based media processing |

## Project Structure

```text
myway-class/
├── frontend/           # User-facing UI
├── backend-spring/     # Primary backend (Spring Boot)
├── backend/            # Legacy backend (Hono/Workers)
├── packages/shared/    # Shared logic across frontend and backend
├── docs/               # Common documentation hub
├── scripts/            # Developer helper scripts
├── tools/              # Orchestrator/agent runtime tools
├── agent.md            # AI collaboration rules
└── README.en.md
```

## Key Screens

- public home
- learner dashboard
- course list and lecture viewing
- lecture studio
- short-form hub and personal short-form management
- AI summary page
- AI chat page
- quiz generation page
- admin dashboard, stats, and user management
- media pipeline page

## Getting Started

### Install

```bash
npm install
```

### Start Development Servers

```bash
npm run dev
```

`npm run dev` currently runs the frontend dev server (`dev:frontend`).

If you want to run frontend and backend separately:

```bash
npm run dev:frontend
npm run dev:backend
```

Use `npm run dev:backend:legacy` only when you need the legacy TypeScript backend.

### Verification and Build

```bash
npm run check:deps
npm run verify
npm run build
npm run test:backend
npm run test:frontend
```

- `npm run check:deps`: checks frontend/backend workspace dependency integrity
- `npm run verify`: dependency checks + frontend build + Spring backend tests
- `npm run build`: frontend build + Spring backend package (`-DskipTests`)

## Scripts

| Command | Description |
|------|------|
| `npm run dev` | Run frontend dev server |
| `npm run dev:frontend` | Run frontend only |
| `npm run dev:backend` | Run Spring backend |
| `npm run dev:backend:legacy` | Run legacy TypeScript backend |
| `npm run check:frontend-deps` | Check frontend workspace dependencies |
| `npm run check:backend-deps` | Check backend workspace dependencies |
| `npm run check:deps` | Check frontend/backend dependencies |
| `npm run verify` | Dependency checks + frontend build + Spring tests |
| `npm run build` | Build frontend and Spring backend |
| `npm run test:backend` | Run Spring backend tests |
| `npm run test:frontend` | Run frontend unit tests (Vitest) |
| `npm run test:e2e:demo-student` | Playwright demo student journey E2E |
| `npm run smoke:media-ai-shortform` | Media/AI/shortform smoke test |
| `npm run orch:run` | Run orchestrator |
| `npm run orch:checks` | Validate orchestrator policy/results |

## CI Operations

- Manual run: `backend-spring-tests` workflow supports `workflow_dispatch`.
- Concurrency: previous runs on the same branch/workflow are auto-canceled (`cancel-in-progress: true`).
- Timeout: `backend-spring-tests` job is limited to 15 minutes (`timeout-minutes: 15`).

## Docs

- [docs/README.md](./docs/README.md): documentation hub
- [docs/project/20-status-and-next-steps.md](./docs/project/20-status-and-next-steps.md): current status and next steps
- [backend-spring/README.md](./backend-spring/README.md): Spring backend runtime/baseline
- [backend/docs/README.md](./backend/docs/README.md): backend docs hub
- [agent.md](./agent.md): AI collaboration rules

## Design Principles

- AI is an assistant, not a replacement.
- Keep outputs structured and provide fallback paths.
- Keep code and docs aligned, and keep decisions traceable.
- Treat lectures as reusable learning assets, not just playback content.

## License

MIT License
