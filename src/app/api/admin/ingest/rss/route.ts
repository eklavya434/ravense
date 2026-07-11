import { NextRequest, NextResponse } from 'next/server';
import { fetchRssArticles } from '@/lib/rss';
import { saveArticle } from '@/lib/data';
import { extractEntities, generateEntityContext } from '@/lib/gemini';
import { DEFAULT_STANCE_AXIS, CategoryKey } from '@/lib/categories';

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

    for (const item of rssArticles) {
      // Create a clean slug
      const slug = item.headline
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      try {
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
        });

        ingestedCount++;
      } catch (err: any) {
        // Capture duplicates or failures
        skippedArticles.push({ 
          headline: item.headline, 
          reason: err.message || 'Duplicate slug or DB write failure' 
        });
      }
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
