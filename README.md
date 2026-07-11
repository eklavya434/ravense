# Ravense

Ravense is a contextual news web application designed to view unmodified news reports mapped with load-bearing entity profiles (definitions, certainty ratings, causal why-now chains, stakeholder maps) and register anonymous reader stance calibrations.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database ORM**: [Prisma ORM v7](https://www.prisma.io/) (configured with PostgreSQL)
- **Database Driver Adapter**: `@prisma/adapter-pg` + `pg` (required in Prisma 7)
- **AI Core**: Gemini API via `@google/generative-ai` legacy SDK
- **Icons**: `lucide-react`

---

## Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is configured for your PostgreSQL instance, and your `GEMINI_API_KEY` is provided from Google AI Studio.

*Note: If no database or Gemini API key is configured, Ravense will gracefully fall back to in-memory mock datasets and extract local simulated intelligence profiles.*

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client
Since Prisma 7 decouples schema definitions and configurations, run the generator:
```bash
npx prisma generate
```

### 4. Push Database Schema & Seed (If PostgreSQL is connected)
If you have a PostgreSQL database connected, push the schema and seed the initial geopolitical articles:
```bash
npx prisma db push
npx prisma db seed
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Folder Structure

- `/prisma/schema.prisma` — Prisma schema defining `Article`, `Entity`, `ArticleEntity`, `NarrativeThread`, and `StanceVote`.
- `/prisma.config.ts` — Centralized database connection config, required in Prisma 7.
- `/src/app/page.tsx` — Feed of dispatches filterable by categories.
- `/src/app/article/[slug]/page.tsx` — Reading experience server loader.
- `/src/components/ArticleReader.tsx` — Interactive reading interface with annotated entity tooltips/drawers and opinion stance sliders.
- `/src/app/admin/ingest` — Admin page and Server Actions to submit articles and run the Gemini entity-extraction pipeline.
- `/src/lib/data.ts` — Data access layer that bridges Prisma Queries with in-memory fallbacks.
- `/src/lib/gemini.ts` — Integration with the Gemini API for intelligence profile extraction.
- `/src/lib/session.ts` — Helper to generate/retrieve anonymous user session identifiers.
