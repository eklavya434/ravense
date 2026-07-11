import { CATEGORY_QUERY_MAP, CategoryKey } from './categories';

const USER_AGENT = 'Ravense/0.1 (student project; contact: eklavya434@gmail.com)';

// Wikidata entity image resolution
export async function resolveEntityImage(entityName: string): Promise<{
  imageUrl: string | null;
  imageSource: 'wikidata' | 'none';
}> {
  try {
    // 1. Search Wikidata for the entity name
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(entityName)}&language=en&format=json`;
    
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!searchRes.ok) throw new Error(`Wikidata search request failed: ${searchRes.status}`);
    
    const searchData = await searchRes.json();
    const qId = searchData.search?.[0]?.id;
    
    if (!qId) {
      return { imageUrl: null, imageSource: 'none' };
    }
    
    // 2. Fetch claims for property P18 (image)
    const claimsUrl = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qId}&property=P18&format=json`;
    
    const claimsRes = await fetch(claimsUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!claimsRes.ok) throw new Error(`Wikidata claims request failed: ${claimsRes.status}`);
    
    const claimsData = await claimsRes.json();
    const filename = claimsData.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    
    if (!filename) {
      return { imageUrl: null, imageSource: 'none' };
    }
    
    // 3. Format Wikimedia Commons filepath URL
    const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;
    
    return {
      imageUrl,
      imageSource: 'wikidata'
    };
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
