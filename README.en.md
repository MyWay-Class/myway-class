# MyWayClass

<p align="left">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Cloudflare_Workers-ready-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
</p>

[한국어 README](./README.md)

MyWayClass is an LMS platform that restructures lectures into personalized short-form learning flows.  
It was built for the 2026 KIT Vibecoding Competition to help learners focus on the exact part they need, while giving instructors and operators tools to repurpose and manage lecture content.

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
- creating a content flow that instructors and learners can reuse

## Core Features

- lecture viewing and learning dashboard
- lecture studio and course management
- short-form generation from lecture content
- AI summaries, AI chat, and quiz generation
- RAG-based Q&A and context lookup
- media upload, audio extraction, and processing pipeline
- separate experiences for students, instructors, and admins
- short-form community and sharing flows

## Workflow

The system is built around lecture fragments rather than a single full-length video.

1. Convert lecture audio to text with STT
2. Chunk the transcript into meaningful segments
3. Use RAG to find evidence segments for a question or learning goal
4. Generate summaries, quizzes, Q&A, and intent classification with AI
5. Connect the selected segments into a learning-focused short-form clip
6. Keep the generated result linked to the original lecture for context

## Screenshots

> The repository does not include real capture assets yet, so the section below uses placeholders that can be replaced later.

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
| Backend | Hono, TypeScript, Cloudflare Workers tooling |
| Shared | Common types, data, and AI/LMS logic under `packages/shared` |
| Build | npm workspaces, esbuild, wrangler, TypeScript |
| Media | `ffmpeg-static` based media processing |

## Project Structure

```text
myway-class/
├── frontend/           # User-facing UI
├── backend/            # API, AI, media processing
├── packages/shared/    # Shared logic across frontend and backend
├── docs/               # Common documentation hub
├── scripts/            # Developer helper scripts
├── agent.md            # AI collaboration rules
└── README.md           # This file
```

## Key Screens

- public home
- learner dashboard
- course list and lecture viewing
- lecture studio
- short-form hub and my short-forms
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

This is the main entry point for running the full local environment.

If you want to run the frontend and backend separately:

```bash
npm run dev:frontend
npm run dev:backend
```

### Verification and Build

```bash
npm run verify
npm run build
```

- `npm run verify` checks dependencies, media-processor type safety, backend build output, and frontend type checking.
- `npm run build` builds both the frontend and backend.

## Scripts

| Command | Description |
|------|------|
| `npm run dev` | Run the full local development environment |
| `npm run dev:frontend` | Run only the frontend |
| `npm run dev:backend` | Run only the backend |
| `npm run dev:media-processor` | Run the media processor bundle |
| `npm run build` | Build frontend and backend |
| `npm run verify` | Run dependency, type, and build checks |
| `npm run check:media-processor` | Type-check the media processor |

## Docs

- [`docs/README.md`](./docs/README.md): full documentation hub
- [`agent.md`](./agent.md): AI collaboration rules
- [`backend/docs/README.md`](./backend/docs/README.md): backend documentation hub
- [`README.md`](./README.md): Korean README

## Design Principles

- AI is an assistant, not a replacement.
- Keep outputs structured and provide fallback paths.
- Keep the code and docs aligned, and make decisions traceable.
- Treat lectures as reusable learning assets, not just playback content.

## License

MIT License
