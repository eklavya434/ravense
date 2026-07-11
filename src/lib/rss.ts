import Parser from 'rss-parser';
import { RSS_FEEDS_CONFIG, CategoryKey } from './categories';

const parser = new Parser();

export interface RssArticleItem {
  headline: string;
  body: string;
  sourceUrl: string;
  publishedAt: Date;
  sourceName: string;
  sourceCountry: string;
}

export async function fetchRssArticles(category: CategoryKey, limit: number = 3): Promise<RssArticleItem[]> {
  const feeds = RSS_FEEDS_CONFIG[category] || [];
  const articles: RssArticleItem[] = [];

  for (const feedConfig of feeds) {
    try {
      const response = await fetch(feedConfig.url, {
        headers: {
          'User-Agent': 'Ravense/0.1 (student project; contact: eklavya434@gmail.com)'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xmlText = await response.text();
      
      const feed = await parser.parseString(xmlText);
      const items = feed.items.slice(0, limit);

      for (const item of items) {
        if (!item.title || !item.link) continue;
        
        // Clean description (remove html tags)
        const rawContent = item.contentSnippet || item.content || item.summary || "";
        const cleanContent = rawContent
          .replace(/<[^>]*>/g, '') // Strip HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanContent.length < 50) continue; // Skip too short summaries

        articles.push({
          headline: item.title,
          body: cleanContent,
          sourceUrl: item.link,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          sourceName: feedConfig.name,
          sourceCountry: feedConfig.country
        });
      }
    } catch (e) {
      console.warn(`Failed to parse RSS feed from ${feedConfig.url}:`, e);
    }
  }

  // Sort by date descending
  return articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
