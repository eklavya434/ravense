import { CATEGORY_QUERY_MAP, CategoryKey } from './categories';

const USER_AGENT = 'Ravense/0.1 (student project; contact: eklavya434@gmail.com)';

// Ambiguous Entity Override Map
const AMBIGUOUS_ENTITIES_OVERRIDE: Record<string, string> = {
  "parliament": "Q1968593", // Parliament of India
  "indian parliament": "Q1968593",
  "lok sabha": "Q1968593",
  "cabinet": "Q1148110", // Union Cabinet of India
  "central bank": "Q809227", // Reserve Bank of India
  "reserve bank of india": "Q809227",
  "rbi": "Q809227",
  "supreme court": "Q971384", // Supreme Court of India
  "supreme court of india": "Q971384",
  "national assembly": "Q1968593"
};

// Helper for direct lookup of image filename by Q-ID
async function fetchWikidataImageByQId(qId: string): Promise<string | null> {
  try {
    const claimsUrl = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qId}&property=P18&format=json`;
    const res = await fetch(claimsUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) throw new Error(`Claims lookup failed: ${res.status}`);
    const data = await res.json();
    return data.claims?.P18?.[0]?.mainsnak?.datavalue?.value || null;
  } catch (error) {
    console.error(`Failed to fetch claims for Q-ID ${qId}:`, error);
    return null;
  }
}

// Helper to check if a Q-ID belongs to a country or expected properties
async function checkWikidataEntityCountry(qId: string): Promise<string | null> {
  try {
    const claimsUrl = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qId}&property=P17&format=json`;
    const res = await fetch(claimsUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const countryQId = data.claims?.P17?.[0]?.mainsnak?.datavalue?.value?.id;
    return countryQId || null;
  } catch {
    return null;
  }
}

// Wikidata entity image resolution
export async function resolveEntityImage(entityName: string, category?: string): Promise<{
  imageUrl: string | null;
  imageSource: 'wikidata' | 'none';
}> {
  try {
    const queryName = entityName.trim();
    const lowerName = queryName.toLowerCase();
    
    console.log(`[WIKIDATA LOOKUP] Querying: "${queryName}" (Category Context: ${category || 'none'})`);

    // 1. Check ambiguous override table
    if (AMBIGUOUS_ENTITIES_OVERRIDE[lowerName]) {
      const qId = AMBIGUOUS_ENTITIES_OVERRIDE[lowerName];
      console.log(`[WIKIDATA OVERRIDE] Matched override: "${queryName}" -> Q-ID: ${qId}`);
      const filename = await fetchWikidataImageByQId(qId);
      if (filename) {
        const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;
        console.log(`[WIKIDATA ACCEPTED] Entity: "${queryName}" matched to Q-ID: ${qId} via Override`);
        return { imageUrl, imageSource: 'wikidata' };
      }
    }

    // 2. Search Wikidata for the entity name
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(queryName)}&language=en&format=json`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!searchRes.ok) throw new Error(`Wikidata search request failed: ${searchRes.status}`);
    const searchData = await searchRes.json();
    const searchResults = searchData.search || [];

    if (searchResults.length === 0) {
      return { imageUrl: null, imageSource: 'none' };
    }

    // 3. Disambiguation loop: filter top 3 candidates
    for (const result of searchResults.slice(0, 3)) {
      const qId = result.id;
      const label = result.label || '';
      const desc = result.description || '';

      // If category is national, verify country is India (Q668) or matches generic description filters
      if (category === 'national') {
        const countryQId = await checkWikidataEntityCountry(qId);
        
        // If it belongs to a country and that country isn't India, reject it for the "national" India-centric context
        if (countryQId && countryQId !== 'Q668') {
          console.warn(`[WIKIDATA REJECTED] Candidate Q-ID: ${qId} ("${label}") country is ${countryQId} (expected India Q668)`);
          continue;
        }

        // Check search description for other countries (e.g. parliament of norway, cabinet of the UK)
        const descLower = desc.toLowerCase();
        if (descLower.includes('norway') || descLower.includes('united kingdom') || descLower.includes('uk ') || descLower.includes('france') || descLower.includes('nepal')) {
          console.warn(`[WIKIDATA REJECTED] Candidate Q-ID: ${qId} description is ambiguous: "${desc}"`);
          continue;
        }
      }

      // Fetch claims for property P18 (image)
      const filename = await fetchWikidataImageByQId(qId);
      if (filename) {
        const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;
        console.log(`[WIKIDATA ACCEPTED] Entity: "${queryName}" matched to Q-ID: ${qId} (Label: "${label}", Description: "${desc}")`);
        return {
          imageUrl,
          imageSource: 'wikidata'
        };
      }
    }
    
    return { imageUrl: null, imageSource: 'none' };
  } catch (error) {
    console.error(`Error resolving entity image for ${entityName}:`, error);
    return { imageUrl: null, imageSource: 'none' };
  }
}

// High-quality local fallbacks if Unsplash API key is missing or query fails
const FALLBACK_CATEGORY_IMAGES: Record<CategoryKey, { imageUrl: string; photographerName: string; photographerUrl: string }> = {
  "geopolitics": {
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Joakim Honkasalo",
    photographerUrl: "https://unsplash.com/@jhonkasalo"
  },
  "national": {
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Kyle Glenn",
    photographerUrl: "https://unsplash.com/@kyleglenn"
  },
  "business": {
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    photographerName: "M. B. M.",
    photographerUrl: "https://unsplash.com/@mbm"
  },
  "sports": {
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Conor Luddy",
    photographerUrl: "https://unsplash.com/@conorluddy"
  },
  "entertainment": {
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Krists Luhaers",
    photographerUrl: "https://unsplash.com/@krists"
  }
};

export async function resolveCategoryImage(category: string): Promise<{
  imageUrl: string;
  photographerName: string;
  photographerUrl: string;
}> {
  const normCategory = category.toLowerCase() as CategoryKey;
  const query = CATEGORY_QUERY_MAP[normCategory] || "news journalism";
  const fallback = FALLBACK_CATEGORY_IMAGES[normCategory] || {
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Roman Kraft",
    photographerUrl: "https://unsplash.com/@romankraft"
  };

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return fallback;
  }

  try {
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;
    const res = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
        'User-Agent': USER_AGENT
      }
    });

    if (!res.ok) throw new Error(`Unsplash API failed with status ${res.status}`);

    const data = await res.json();
    const photo = data.results?.[0];

    if (!photo) {
      return fallback;
    }

    return {
      imageUrl: photo.urls.regular,
      photographerName: photo.user.name || "Unknown",
      photographerUrl: photo.user.links?.html || "https://unsplash.com"
    };
  } catch (error) {
    console.error(`Error resolving Unsplash image for category ${category}:`, error);
    return fallback;
  }
}
