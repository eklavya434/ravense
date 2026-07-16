import { NextRequest, NextResponse } from 'next/server';
import { fetchRssArticles, verifySourceLink } from '@/lib/rss';
import { saveArticle, logIngestionRun } from '@/lib/data';
import { extractEntities, generateEntityContext, generateSummary } from '@/lib/gemini';
import { CATEGORIES, DEFAULT_STANCE_AXIS, CategoryKey } from '@/lib/categories';
import { prisma } from '@/lib/db';
import { triggerIngestionNotifications } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleIngest(request);
}

export async function POST(request: NextRequest) {
  return handleIngest(request);
}

async function handleIngest(request: NextRequest) {
  // Validate Vercel Cron authorization secret
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Only enforce secret in production Vercel environments
    if (process.env.NODE_ENV === 'production') {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let feedsChecked = 0;
  let newArticles = 0;
  let skipped = 0;
  const errors: any[] = [];

  try {
    // 1. Gather candidate articles from all categories
    const candidates: Array<{ headline: string; body: string; sourceUrl: string; publishedAt: Date; category: string; sourceName: string; sourceCountry: string }> = [];

    for (const cat of CATEGORIES) {
      feedsChecked += 2; // Approx 2 feeds per category configuration
      try {
        const feedItems = await fetchRssArticles(cat.key, 4); // Fetch top 4 items from each category
        feedItems.forEach(item => {
          candidates.push({
            ...item,
            category: cat.key
          });
        });
      } catch (e: any) {
        errors.push({ category: cat.key, phase: 'fetch', message: e.message || 'Feed fetch error' });
      }
    }

    // 2. Filter out already ingested articles (deduplicate)
    const uniqueCandidates: typeof candidates = [];
    for (const item of candidates) {
      // Validate absolute URL
      if (!item.sourceUrl || (!item.sourceUrl.startsWith('http://') && !item.sourceUrl.startsWith('https://'))) {
        skipped++;
        continue;
      }

      // Staleness cutoff check: 7 days ago
      const stalenessCutoff = new Date();
      stalenessCutoff.setDate(stalenessCutoff.getDate() - 7);
      if (item.publishedAt < stalenessCutoff) {
        skipped++;
        continue;
      }

      // Check slug uniqueness
      const slug = item.headline
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      let exists = false;
      try {
        // Quick look up in Postgres database
        const dbConnected = !!process.env.DATABASE_URL;
        if (dbConnected) {
          const dbMatch = await prisma.article.findFirst({
            where: {
              OR: [
                { slug },
                { sourceUrl: item.sourceUrl }
              ]
            }
          });
          if (dbMatch) exists = true;
        }
      } catch (err) {
        // fallback to data layer checks on insert
      }

      if (exists) {
        skipped++;
      } else {
        uniqueCandidates.push(item);
      }
    }

    // Sort by publication date descending (newest first)
    uniqueCandidates.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    // 3. Rate limit: Cap at 10 items processed per cron run
    const limit = 10;
    const itemsToProcess = uniqueCandidates.slice(0, limit);
    const savedArticlesList: Array<{ headline: string; slug: string; category: string }> = [];

    for (const item of itemsToProcess) {
      const slug = item.headline
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      try {
        // Verify source link before proceeding
        const linkStatus = await verifySourceLink(item.sourceUrl);
        if (!linkStatus.verified) {
          console.warn(`Ingestion: Discarding article because sourceUrl link check failed: ${item.sourceUrl}`);
          skipped++;
          continue;
        }

        // Generate consistent ~60-word explanation via Gemini
        const summaryText = await generateSummary(item.headline, item.body);

        // Run entity extraction via Gemini (or fallback)
        const extracted = await extractEntities(item.headline, item.body);

        // Resolve context for each entity
        const resolvedEntities = [];
        for (const ent of extracted) {
          const firstMention = ent.mentions[0];
          const contextSnippet = item.body.substring(
            Math.max(0, firstMention.startOffset - 80),
            Math.min(item.body.length, firstMention.endOffset + 80)
          );

          // Get context via Gemini (or fallback)
          const context = await generateEntityContext(ent.name, contextSnippet);

          resolvedEntities.push({
            name: ent.name,
            aliases: [],
            oneLiner: context.oneLiner,
            certainty: context.certainty,
            whyNow: context.whyNow,
            stakeholders: context.stakeholders,
            mentions: ent.mentions.map(m => ({
              startOffset: m.startOffset,
              endOffset: m.endOffset,
            })),
          });
        }

        const stance = DEFAULT_STANCE_AXIS[item.category as CategoryKey] || { left: "De-escalates", right: "Escalates" };

        await saveArticle({
          headline: item.headline,
          slug,
          body: item.body,
          category: item.category,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          sourceCountry: item.sourceCountry,
          publishedAt: item.publishedAt,
          stanceAxis: stance,
          entities: resolvedEntities,
          summary: summaryText,
          sourceLinkVerified: linkStatus.verified,
          sourceLinkCheckedAt: linkStatus.checkedAt,
        });

        newArticles++;
        savedArticlesList.push({ headline: item.headline, slug, category: item.category });
      } catch (err: any) {
        errors.push({ headline: item.headline, phase: 'ingest', message: err.message || 'Duplicate write failure' });
        skipped++;
      }
    }

    // Trigger push alerts for newly ingested dispatches
    if (savedArticlesList.length > 0) {
      await triggerIngestionNotifications(savedArticlesList);
    }

    // Record Ingestion log to DB
    await logIngestionRun(feedsChecked, newArticles, skipped, errors.length > 0 ? errors : null);

    return NextResponse.json({
      success: true,
      feedsChecked,
      newArticles,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Cron Ingestion Error:', error);
    await logIngestionRun(feedsChecked, newArticles, skipped, [{ phase: 'fatal', message: error.message || 'Fatal error' }]);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
