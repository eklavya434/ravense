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

export function normalizeUrl(url: string, feedUrl?: string): string | null {
  if (!url) return null;
  let normalized = url.trim();

  // If starts with protocol-relative double slash
  if (normalized.startsWith('//')) {
    return 'https:' + normalized;
  }

  // If already absolute HTTP/HTTPS
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  // Check if it looks like a domain without a protocol (e.g. www.reuters.com or reuters.com/news)
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(normalized)) {
    return 'https://' + normalized;
  }

  // If relative path (starts with /) and we have a feedUrl to resolve against
  if (normalized.startsWith('/') && feedUrl) {
    try {
      const feedObj = new URL(feedUrl);
      return `${feedObj.protocol}//${feedObj.hostname}${normalized}`;
    } catch {
      return null;
    }
  }

  return null;
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
        
        const resolvedUrl = normalizeUrl(item.link || '', feedConfig.url);
        if (!resolvedUrl) continue;

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
          sourceUrl: resolvedUrl,
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

export async function verifySourceLink(url: string): Promise<{ verified: boolean; checkedAt: Date }> {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return { verified: false, checkedAt: new Date() };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Ravense/0.1 (link validator; contact: eklavya434@gmail.com)'
      }
    });
    
    clearTimeout(timeoutId);
    
    const isOk = response.status >= 200 && response.status < 400;
    return { verified: isOk, checkedAt: new Date() };
  } catch (error) {
    console.warn(`Source link check failed for ${url}:`, error);
    
    // Fallback GET request with Range header
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-100',
          'User-Agent': 'Ravense/0.1 (link validator; contact: eklavya434@gmail.com)'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const isOk = getResponse.status >= 200 && getResponse.status < 400;
      return { verified: isOk, checkedAt: new Date() };
    } catch {
      return { verified: false, checkedAt: new Date() };
    }
  }
}

