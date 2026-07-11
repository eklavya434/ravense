export const CATEGORIES = [
  { key: "geopolitics", label: "Geopolitics" },
  { key: "national", label: "National" },
  { key: "business", label: "Business" },
  { key: "sports", label: "Sports" },
  { key: "entertainment", label: "Entertainment" },
] as const;

export type CategoryKey = typeof CATEGORIES[number]['key'];

export interface RssFeedSource {
  name: string;
  url: string;
  country: string;
}

export const DEFAULT_STANCE_AXIS: Record<CategoryKey, { left: string; right: string }> = {
  geopolitics: { left: "De-escalates", right: "Escalates" },
  national: { left: "Positive for the public", right: "Concerning for the public" },
  business: { left: "Bearish", right: "Bullish" },
  sports: { left: "Underdog wins", right: "Favorite wins" },
  entertainment: { left: "Underwhelming", right: "Lives up to the hype" },
};

export const CATEGORY_QUERY_MAP: Record<CategoryKey, string> = {
  geopolitics: "world map diplomacy",
  national: "parliament government building india",
  business: "stock exchange finance",
  sports: "stadium crowd sport",
  entertainment: "film set cinema stage",
};

export const RSS_FEEDS_CONFIG: Record<CategoryKey, RssFeedSource[]> = {
  geopolitics: [
    { name: "Reuters News", url: "https://www.reutersagency.com/feed/?best-topics=political-news", country: "Global" },
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", country: "Qatar" },
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", country: "UK" }
  ],
  national: [
    { name: "The Hindu", url: "https://www.thehindu.com/news/national/feeder/default.rss", country: "India" },
    { name: "Indian Express", url: "https://indianexpress.com/section/india/feed/", country: "India" }
  ],
  business: [
    { name: "Economic Times", url: "https://economictimes.indiatimes.com/rssfeedsdefault.cms", country: "India" },
    { name: "Livemint", url: "https://www.livemint.com/rss/news", country: "India" }
  ],
  sports: [
    { name: "ESPN Cricinfo", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml", country: "Global" },
    { name: "The Hindu Sport", url: "https://www.thehindu.com/sport/feeder/default.rss", country: "India" }
  ],
  entertainment: [
    { name: "Indian Express Ent", url: "https://indianexpress.com/section/entertainment/feed/", country: "India" },
    { name: "Hindustan Times Ent", url: "https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml", country: "India" }
  ]
};
