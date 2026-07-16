import { NextRequest, NextResponse } from 'next/server';
import { fetchRssArticles, verifySourceLink } from '@/lib/rss';
import { saveArticle } from '@/lib/data';
import { extractEntities, generateEntityContext, generateSummary } from '@/lib/gemini';
import { DEFAULT_STANCE_AXIS, CategoryKey } from '@/lib/categories';
import { triggerIngestionNotifications } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // 1. Fetch latest RSS items (fetch up to 3 items)
    const rssArticles = await fetchRssArticles(category as CategoryKey, 3);
    let ingestedCount = 0;
    const skippedArticles = [];
    const savedArticlesList: Array<{ headline: string; slug: string; category: string }> = [];

    for (const item of rssArticles) {
      // Validate absolute URL
      if (!item.sourceUrl || (!item.sourceUrl.startsWith('http://') && !item.sourceUrl.startsWith('https://'))) {
        skippedArticles.push({ headline: item.headline, reason: 'Invalid or relative source URL' });
        continue;
      }

      // Staleness cutoff check: 7 days ago
      const stalenessCutoff = new Date();
      stalenessCutoff.setDate(stalenessCutoff.getDate() - 7);
      if (item.publishedAt < stalenessCutoff) {
        skippedArticles.push({ headline: item.headline, reason: 'Article is older than 7 days staleness cutoff' });
        continue;
      }

      // Create a clean slug
      const slug = item.headline
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      try {
        // Verify source link before proceeding
        const linkStatus = await verifySourceLink(item.sourceUrl);
        if (!linkStatus.verified) {
          skippedArticles.push({ headline: item.headline, reason: `Source URL failed link check: ${item.sourceUrl}` });
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

        const stance = DEFAULT_STANCE_AXIS[category as CategoryKey] || { left: "De-escalates", right: "Escalates" };

        await saveArticle({
          headline: item.headline,
          slug,
          body: item.body,
          category,
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

        ingestedCount++;
        savedArticlesList.push({ headline: item.headline, slug, category });
      } catch (err: any) {
        // Capture duplicates or failures
        skippedArticles.push({ 
          headline: item.headline, 
          reason: err.message || 'Duplicate slug or DB write failure' 
        });
      }
    }

    // Trigger push alerts for newly ingested dispatches
    if (savedArticlesList.length > 0) {
      await triggerIngestionNotifications(savedArticlesList);
    }

    return NextResponse.json({
      success: true,
      ingestedCount,
      skippedCount: skippedArticles.length,
      skipped: skippedArticles,
    });
  } catch (error: any) {
    console.error('Error syncing RSS feeds:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
