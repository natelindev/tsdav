---
sidebar_position: 100
title: LLM Integration
description: AI-ready routes for LLMs to understand and interact with tsdav documentation
---

# LLM Integration

This documentation site provides special routes designed for Large Language Models (LLMs) to better understand and interact with the tsdav documentation. Whether you're using ChatGPT, Claude, Cursor, Copilot, or any other AI assistant, these routes make it easy to feed tsdav docs directly into your workflow.

## Available Routes

### Full Documentation

#### [`/llms-full.txt`](https://tsdav.vercel.app/llms-full.txt)

A plain-text representation of the **entire** documentation, optimized for LLM consumption. This file concatenates all documentation content into a single, easily parseable text file that includes:

- Page titles and URLs
- Page descriptions
- Full content of each documentation page

Use this when you want an AI assistant to have complete knowledge of the tsdav library.

### Documentation Index

#### [`/llms.txt`](https://tsdav.vercel.app/llms.txt)

A lightweight index of all documentation pages with titles, descriptions, and links. Use this to give an LLM an overview of available documentation and let it decide which pages to read in detail.

### Individual Pages as Markdown

#### `/docs/[path].md`

You can access the raw Markdown source of any individual documentation page by appending `.md` to the docs URL. For example:

- [`/docs/intro.md`](https://tsdav.vercel.app/docs/intro.md) — Getting started guide
- [`/docs/caldav/fetchCalendars.md`](https://tsdav.vercel.app/docs/caldav/fetchCalendars.md) — CalDAV calendar fetching
- [`/docs/carddav/fetchVCards.md`](https://tsdav.vercel.app/docs/carddav/fetchVCards.md) — CardDAV vCard fetching

This is useful when you want an AI assistant to focus on a specific topic without loading the entire documentation.

## How to Use with AI Assistants

### ChatGPT / Claude / Other Chat UIs

Paste the full documentation URL into your prompt:

```
Please read https://tsdav.vercel.app/llms-full.txt and help me set up CalDAV sync with Google Calendar.
```

### Cursor / Copilot / AI-Enabled Editors

Add the documentation URL as context in your AI-enabled editor:

- **Cursor**: Use `@docs` or paste the URL in chat to provide tsdav context
- **Copilot**: Reference the docs URL when asking questions about tsdav

### Custom LLM Applications

If you're building an application that uses LLMs, you can programmatically fetch the documentation:

```typescript
// Fetch full documentation for RAG or context injection
const response = await fetch('https://tsdav.vercel.app/llms-full.txt');
const docs = await response.text();

// Or fetch a specific page
const calendarDocs = await fetch('https://tsdav.vercel.app/docs/caldav/fetchCalendars.md');
const calendarContent = await calendarDocs.text();
```

## What's Included

The LLM-friendly output covers all tsdav documentation:

| Section | Description |
|---------|-------------|
| **Introduction** | Library overview, installation, and quick start |
| **WebDAV** | Core WebDAV operations — `davRequest`, `propfind`, account discovery |
| **CalDAV** | Calendar operations — fetch, create, update, delete calendar objects |
| **CardDAV** | Contact operations — fetch, create, update, delete vCards |
| **Types** | TypeScript type definitions and models |
| **Helpers** | Authentication helpers, request utilities, and constants |
| **Smart Calendar Sync** | End-to-end sync workflow with database schema guidance |
| **Cloud Providers** | Provider-specific setup for Apple, Google, Fastmail, and more |

## Why LLM-Friendly Docs?

- **Faster onboarding**: AI assistants can instantly learn the full API surface
- **Better code generation**: With complete type information and examples, AI produces more accurate code
- **Reduced hallucination**: Grounding AI responses in actual documentation prevents incorrect API usage
- **Always up-to-date**: The routes serve the latest built documentation automatically
