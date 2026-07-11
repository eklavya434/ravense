# Ravense Walkthrough

We have successfully implemented and deployed **Phase 1** (Core platform setup, dispatches feed, dynamic data access layer with offline memory fallback, and Gemini entity-extraction pipeline), **Phase 2** (Image Integration), **Phase 3** (Category Expansion), **Phase 4** (Narrative Threads & Admin Ingest), **Phase 5** (Latest News & Live Ingestion), and **Phase 6 / Bug Fixes & Opinions** of the **Ravense** news-context platform. All components have been verified locally and pushed to the GitHub repository.

---

## Changes Made

### Phase 1: Core Platform Setup
- **Framework & Styling**: Next.js App Router, TypeScript, Tailwind CSS v4, and Lucide Icons.
- **Database Engine (Prisma 7)**: Configured using a decoupled `prisma.config.ts` structure and the `@prisma/adapter-pg` driver.
- **Data Access Layer with Fallbacks**: Created a client wrapper in `src/lib/data.ts` that gracefully degrades to local mock databases when database variables are unconfigured.
- **Gemini Ingestion Pipeline**: Built a Client-Side submission form on `/admin/ingest` linked to the server-side extraction engine (`gemini-1.5-flash`) for identifying entities and computing character offsets.
- **Intel Feed & Reader**: Created `/` category index and `/article/[slug]` reader displaying entity profile details (definition, causal chains, stakeholder maps) and anonymous stance sliders with live distribution bar charts.

### Phase 2: Image Integration
- **Database Schema**: Expanded `Entity` with image fields (`imageUrl`, `imageSource`, `imageFetchedAt`) and added the `CategoryImage` model.
- **Wikidata Entity Thumbnails**: Scrapes entity names on Wikidata search, extracts the Q-ID, queries claims for property `P18` (image name), and constructs a Wikimedia Commons FilePath URL. 
- **Unsplash Category Banners**: Scrapes category-specific images from Unsplash, caching image URLs and photographer credits into `CategoryImage`. Includes robust local fallback options.
- **Aesthetic UI**: Displayed aspect-[21/9] banners at the top of articles with photographer credit links and 64x64px rounded profile icons next to entity names.

### Phase 3: Category Expansion
- **Database Enum**: Replaced the `category` string field with a Prisma enum `Category` (`geopolitics`, `national`, `business`, `sports`, `entertainment`) to enforce strict type safety.
- **Category Configurations (`src/lib/categories.ts`)**:
  - Centralized Category definitions.
  - Configured Unsplash query mapping for the expanded categories.
  - Specified live RSS feeds per category (Reuters, Al Jazeera, BBC, The Hindu, ESPN Cricinfo, Hindustan Times).
- **RSS Auto-Ingest Panel (`src/lib/rss.ts` & `/admin/ingest`)**:
  - Implemented an RSS sync engine using `rss-parser` that fetches feeds for a selected category, sanitizes HTML descriptions, and triggers automated auto-ingestion.
  - Added `/api/admin/ingest/rss` endpoint to run parsed RSS feed items through the Gemini NER pipeline and save them dynamically.
  - Added a sidebar RSS Sync triggers panel to `/admin/ingest`.
- **Primary CategoryNav Header (`src/components/CategoryNav.tsx`)**:
  - Designed a reusable, sticky horizontal navigation header showing all categories.
  - Highlighted the active category with our design system's wax-seal amber accent color.
- **Category-Specific Stance Axes**:
  - Updated `/article/[slug]` to dynamically map stance slider labels based on default category axis definitions (e.g. Bearish/Bullish for Business, Underdog/Favorite for Sports, lives up to the hype for Entertainment).

### Phase 4: Narrative Threads & Admin Ingest
- **Narrative Retrieval API (`src/app/api/narratives/route.ts`)**: Exposed narrative thread configurations dynamically.
- **Ingestion Association (`src/app/admin/ingest/page.tsx` & `src/lib/data.ts`)**:
  - Added selectors in the manual form to dynamically query and bind incoming reports to existing narrative threads.
  - Allowed creating new narrative threads on the fly by keying in a new thread title.
- **Homepage Timeline Filtering (`src/app/page.tsx`)**:
  - Remodeled the home page to include a right-hand sidebar listing all active narrative threads alongside the count of updates.
  - Added support for `?narrative=id` search parameters to dynamically isolate feed articles to a specific chronological narrative timeline.
  - Displayed a banner summary describing the active narrative filter.

### Phase 5: Latest News & Live Scheduled Ingestion
- **Database Logging & Deduplication (`prisma/schema.prisma` & `src/lib/data.ts`)**:
  - Implemented a unique constraint on `Article.sourceUrl` to prevent duplicate ingestion of crawled RSS feeds.
  - Created `IngestionLog` database table mapping.
  - Developed the `logIngestionRun` helper to log cron crawlers metrics (checked counts, new inserts, skipped items, error logs).
- **Vercel Cron Trigger Route (`src/app/api/cron/ingest/route.ts`)**:
  - Set up a scheduled endpoint `/api/cron/ingest` triggered every 30 minutes.
  - Configured `vercel.json` scheduler.
  - Secured endpoint verification via `Authorization: Bearer <CRON_SECRET>` headers.
  - Enforced a rate-limit constraint capping Gemini extraction pipeline calls at `10` new articles per run.
- **Homepage Freshness UI (`src/app/page.tsx`)**:
  - Implemented human-friendly relative publication publication timing indicators (e.g. "5m ago", "2h ago").
  - Designed a distinct **"Just In"** timeline header banner displaying fresh articles published in the last 4 hours under a pulsing live indicator.

### Phase 6 & Bug Fixes: Detailed Publisher Columns, URL Normalization, Entity Disambiguation, and Opinion Board
- **Publisher Metadata**: Added `sourceName` and `sourceCountry` properties to database models. Upgraded manual ingestion forms and RSS configuration schemas to save and display dynamic news source publisher credentials.
- **Bug 1 Fix (Entity Ambiguity)**:
  - Updated Gemini's extraction prompt to preserve context qualifiers (e.g., "Indian Parliament" instead of "Parliament").
  - Created a manual lookup table mapping known ambiguous terms directly to verified Q-IDs.
  - Added search candidate verification checking entity countries (expecting `P17` to match India (`Q668`) for `national` category entries).
- **Bug 2 Fix (Teaser Layout & Discovery)**: Framed the main article panel as a discovery page displaying short summaries alongside a prominent, premium outbound redirect button to the original publisher.
- **Bug 3 Fix (Link Checks)**: Implemented strict validation checks at manual form submissions, RSS imports, and API cron ingestions to ensure all source links are valid absolute HTTP/HTTPS URLs.
- **Reader Opinion Board**:
  - Removed the aggregated stance distribution frequency bar chart.
  - Created the `Opinion` model to save free-text responses mapped to anonymous reader sessions.
  - Integrated a Gemini-powered JSON content moderation API to filter out toxicity, hate speech, spam, and vulgarity.
  - Created a responsive layout in `ArticleReader.tsx` displaying interactive textareas and chronological lists of approved user opinions.

---

## Verification Results

- **TypeScript compilation**: Compiles cleanly with zero errors (`npm run build`).
- **GitHub Sync**: Committed and pushed changes successfully to [eklavya434/ravense](https://github.com/eklavya434/ravense) branch `main`.
