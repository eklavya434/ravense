export const CATEGORIES = [
  { key: "geopolitics", label: "Geopolitics" },
  { key: "national", label: "National" },
  { key: "business", label: "Business" },
  { key: "sports", label: "Sports" },
  { key: "entertainment", label: "Entertainment" },
] as const;

export type CategoryKey = typeof CATEGORIES[number]['key'];

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

export const RSS_FEEDS_CONFIG: Record<CategoryKey, string[]> = {
  geopolitics: [
    "https://www.reutersagency.com/feed/?best-topics=political-news", // Reuters World RSS often changes; political-news or feeds are safe
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://feeds.bbci.co.uk/news/world/rss.xml"
  ],
  national: [
    "https://www.thehindu.com/news/national/feeder/default.rss",
    "https://indianexpress.com/section/india/feed/"
  ],
  business: [
    "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
    "https://www.livemint.com/rss/news"
  ],
  sports: [
    "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
    "https://www.thehindu.com/sport/feeder/default.rss"
  ],
  entertainment: [
    "https://indianexpress.com/section/entertainment/feed/",
    "https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml"
  ]
};
