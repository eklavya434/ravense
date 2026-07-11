import { prisma } from './db';
import { Category } from '@prisma/client';
import { resolveEntityImage, resolveCategoryImage } from './images';

// In-memory mock CategoryImages
const mockCategoryImages: Record<string, { id: string; category: string; imageUrl: string; photographerName: string; photographerUrl: string; fetchedAt: Date }> = {
  'geopolitics': {
    id: 'cat-img-geopolitics',
    category: 'geopolitics',
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Joakim Honkasalo",
    photographerUrl: "https://unsplash.com/@jhonkasalo",
    fetchedAt: new Date()
  },
  'national': {
    id: 'cat-img-domestic-politics',
    category: 'national',
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Kyle Glenn",
    photographerUrl: "https://unsplash.com/@kyleglenn",
    fetchedAt: new Date()
  },
  'business': {
    id: 'cat-img-economy',
    category: 'business',
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    photographerName: "M. B. M.",
    photographerUrl: "https://unsplash.com/@mbm",
    fetchedAt: new Date()
  },
  'sports': {
    id: 'cat-img-sports',
    category: 'sports',
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Conor Luddy",
    photographerUrl: "https://unsplash.com/@conorluddy",
    fetchedAt: new Date()
  },
  'entertainment': {
    id: 'cat-img-entertainment',
    category: 'entertainment',
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Krists Luhaers",
    photographerUrl: "https://unsplash.com/@krists",
    fetchedAt: new Date()
  }
};

// In-memory mock fallback data
const mockNarrative = {
  id: 'narrative-1',
  title: 'Global Maritime & Border Security Summit 2026',
};

const mockEntities: any[] = [
  {
    id: 'entity-nato',
    name: 'NATO',
    aliases: ['Alliance'],
    oneLiner: 'North Atlantic Treaty Organization, a political and military alliance of 32 European and North American countries.',
    certainty: 'confirmed',
    whyNow: [
      'Tensions in the Eastern Mediterranean require unified command presence.',
      'Maritime border disputes between Greece and Turkey need mediation.',
      'Reinforcing Eastern flank defense posture ahead of winter exercises.'
    ],
    stakeholders: [
      { name: 'United States', wants: 'Maintenance of Alliance unity and collective deterrence' },
      { name: 'Turkey', wants: 'Recognition of its maritime jurisdiction and regional security role' }
    ],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Flag_of_NATO.svg/400px-Flag_of_NATO.svg.png',
    imageSource: 'wikidata',
    imageFetchedAt: new Date()
  },
  {
    id: 'entity-antalya',
    name: 'Antalya',
    aliases: ['Antalya, Turkey'],
    oneLiner: 'A major Turkish resort city on the Mediterranean coast, often used for international diplomatic summits.',
    certainty: 'confirmed',
    whyNow: [
      'Hosts the 2026 Mediterranean Security Summit.',
      'Strategic hub for Turkey\'s diplomatic outreach in the region.'
    ],
    stakeholders: [
      { name: 'Turkish Government', wants: 'Promotion of the city as a neutral ground for international mediation' }
    ],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Flag_of_Turkey.svg/400px-Flag_of_Turkey.svg.png',
    imageSource: 'wikidata',
    imageFetchedAt: new Date()
  },
  {
    id: 'entity-mediterranean',
    name: 'Mediterranean',
    aliases: ['Mediterranean coast', 'Mediterranean Security'],
    oneLiner: 'An intercontinental sea stretching from the Atlantic Ocean to Asia, key to global shipping and security.',
    certainty: 'confirmed',
    whyNow: [
      'Increasing naval deployments by non-regional actors.',
      'Escalating migration and border surveillance efforts.'
    ],
    stakeholders: [
      { name: 'European Union', wants: 'Secured maritime borders and stable migration management' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-arctic-council',
    name: 'Arctic Council',
    aliases: ['Council'],
    oneLiner: 'A high-level intergovernmental forum that addresses issues faced by the Arctic governments and indigenous peoples.',
    certainty: 'official statement',
    whyNow: [
      'Tromsø summit marks first high-level meeting since recent chair rotation.',
      'Opening of new shipping lanes due to record ice melts.',
      'Unilateral claims on extended continental shelves.'
    ],
    stakeholders: [
      { name: 'Norway', wants: 'Successful chairmanship and preservation of diplomatic channel' },
      { name: 'Russia', wants: 'Unrestricted navigation and mineral exploration rights in its economic zone' },
      { name: 'United States', wants: 'Stricter environmental regulations and limitation of foreign military presence' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-tromso',
    name: 'Tromsø',
    aliases: ['Tromsø, Norway'],
    oneLiner: 'A city in northern Norway, known as a major cultural and scientific hub in the Arctic Circle.',
    certainty: 'confirmed',
    whyNow: [
      'Hosting the Arctic Council ministerial summit.',
      'Location of key polar research and monitoring facilities.'
    ],
    stakeholders: [
      { name: 'Arctic Council Secretariat', wants: 'Smooth execution of diplomatic proceedings' }
    ],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Norway.svg/400px-Flag_of_Norway.svg.png',
    imageSource: 'wikidata',
    imageFetchedAt: new Date()
  },
  {
    id: 'entity-norway',
    name: 'Norway',
    aliases: ['Norwegian'],
    oneLiner: 'A Nordic country in Northern Europe, currently holding the chair of the Arctic Council.',
    certainty: 'confirmed',
    whyNow: [
      'Steering diplomatic negotiations amidst heightened geopolitical tensions.',
      'Balancing environmental protection with domestic oil and gas interests.'
    ],
    stakeholders: [
      { name: 'Norway State', wants: 'Retention of regional stability and stable gas exports to Europe' }
    ],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Norway.svg/400px-Flag_of_Norway.svg.png',
    imageSource: 'wikidata',
    imageFetchedAt: new Date()
  },
  {
    id: 'entity-singapore',
    name: 'Singapore',
    aliases: [],
    oneLiner: 'A sovereign island country and city-state in maritime Southeast Asia, major global financial and shipping hub.',
    certainty: 'confirmed',
    whyNow: [
      'Launches joint naval patrol with neighbors.',
      'Rising shipping insurance costs threaten its port revenues.'
    ],
    stakeholders: [
      { name: 'Port Authority of Singapore', wants: 'Uninterrupted flow of commercial shipping vessels through the strait' }
    ],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Singapore.svg/400px-Flag_of_Singapore.svg.png',
    imageSource: 'wikidata',
    imageFetchedAt: new Date()
  },
  {
    id: 'entity-malacca-strait',
    name: 'Strait of Malacca',
    aliases: ['channel'],
    oneLiner: 'A narrow stretch of water between the Malay Peninsula and the Indonesian island of Sumatra, one of the world\'s most critical shipping lanes.',
    certainty: 'confirmed',
    whyNow: [
      'Recent spike in maritime security incidents and piracy reports.',
      'Surge in shipping insurance premiums for vessels crossing the strait.'
    ],
    stakeholders: [
      { name: 'International Shipping Association', wants: 'Enhanced security and reduction of insurance risk premiums' },
      { name: 'Indonesia & Malaysia', wants: 'Maintenance of sovereignty over the waters while securing trade routes' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  }
];

const mockArticles: any[] = [
  {
    id: 'article-1',
    headline: 'NATO Ministers Convene in Antalya to Address Mediterranean Security Concerns',
    slug: 'nato-ministers-convene-antalya-mediterranean',
    body: 'Ministers from NATO gathered in Antalya, Turkey, this week to discuss regional stability and security cooperation. The conference, hosted by Turkish diplomats, aims to resolve disputes over maritime borders in the Mediterranean.',
    category: 'geopolitics',
    publishedAt: new Date(),
    createdAt: new Date(),
    sourceUrl: 'https://example.com/nato-antalya',
    narrativeId: 'narrative-1',
    narrative: mockNarrative,
    stanceAxis: { left: 'De-escalates', right: 'Escalates' },
    categoryImageId: 'cat-img-geopolitics',
    categoryImage: mockCategoryImages['geopolitics'],
    entities: [
      { id: 'ae-1-1', startOffset: 15, endOffset: 19, entityId: 'entity-nato', entity: mockEntities[0] },
      { id: 'ae-1-2', startOffset: 32, endOffset: 39, entityId: 'entity-antalya', entity: mockEntities[1] },
    ]
  },
  {
    id: 'article-2',
    headline: 'Indian Parliament Proposes Digital Personal Data Protection Act Amendments',
    slug: 'indian-parliament-proposes-data-act-amendments',
    body: 'New Delhi — The Indian Parliament debated amendments to the Digital Personal Data Protection Act. Officials stated the revisions aim to streamline compliance for startups.',
    category: 'national',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/indian-data-act',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Positive for the public', right: 'Concerning for the public' },
    categoryImageId: 'cat-img-domestic-politics',
    categoryImage: mockCategoryImages['national'],
    entities: [
      { id: 'ae-2-1', startOffset: 16, endOffset: 33, entityId: 'entity-parliament', entity: mockEntities[2] },
    ]
  },
  {
    id: 'article-3',
    headline: 'Global Markets Recoil as Tech Influx Signals Automation Shift',
    slug: 'global-markets-recoil-tech-influx-automation',
    body: 'Silicon Valley — Tech firms at the NASDAQ stock exchange registered record-high investments, signaling a major automation shift.',
    category: 'business',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/tech-automation',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Bearish', right: 'Bullish' },
    categoryImageId: 'cat-img-economy',
    categoryImage: mockCategoryImages['business'],
    entities: [
      { id: 'ae-3-1', startOffset: 23, endOffset: 29, entityId: 'entity-nasdaq', entity: mockEntities[3] },
    ]
  },
  {
    id: 'article-4',
    headline: 'Championship Final: Underdog Victory Stuns Wembley Stadium Crowd',
    slug: 'championship-final-underdog-victory-wembley',
    body: 'London — The Wembley Stadium final ended in a historic victory yesterday, defying predictions from sports analysts.',
    category: 'sports',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/wembley-victory',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Underdog wins', right: 'Favorite wins' },
    categoryImageId: 'cat-img-sports',
    categoryImage: mockCategoryImages['sports'],
    entities: [
      { id: 'ae-4-1', startOffset: 13, endOffset: 28, entityId: 'entity-wembley', entity: mockEntities[4] },
    ]
  },
  {
    id: 'article-5',
    headline: 'Cannes Film Festival Announces Groundbreaking Independent Stage Lineup',
    slug: 'cannes-film-festival-announces-independent-lineup',
    body: 'Cannes — Directors at the Cannes Film Festival unveiled the independent films lineup, signaling departures from mainstream releases.',
    category: 'entertainment',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/cannes-stage',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Underwhelming', right: 'Lives up to the hype' },
    categoryImageId: 'cat-img-entertainment',
    categoryImage: mockCategoryImages['entertainment'],
    entities: [
      { id: 'ae-5-1', startOffset: 20, endOffset: 41, entityId: 'entity-cannes', entity: mockEntities[5] },
    ]
  }
];

// In-memory stance votes fallback
const mockStanceVotes: Record<string, number[]> = {
  'article-1': [10, 20, 30, 45, 60, 62, 70, 75, 80],
  'article-2': [20, 25, 30, 48, 50, 45],
  'article-3': [60, 65, 75, 80, 85, 90],
  'article-4': [15, 20, 25, 45, 60],
  'article-5': [55, 60, 70, 72, 85],
};

const mockNarratives = [
  {
    id: 'narrative-1',
    title: 'Global Maritime & Border Security Summit 2026',
  }
];

// Check if database is configured and accessible
let isDbActive = false;

async function checkDbConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost:5432/ravense')) {
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbActive = true;
    return true;
  } catch (e) {
    isDbActive = false;
    return false;
  }
}

export async function getArticles() {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      return await prisma.article.findMany({
        orderBy: { publishedAt: 'desc' },
        include: {
          narrative: true,
          categoryImage: true,
        },
      });
    } catch (e) {
      console.error('Error fetching articles from DB, using mock fallback.', e);
    }
  }
  return mockArticles.map(a => ({
    id: a.id,
    headline: a.headline,
    slug: a.slug,
    body: a.body,
    category: a.category,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
    sourceUrl: a.sourceUrl,
    narrativeId: a.narrativeId,
    narrative: a.narrative,
    stanceAxis: a.stanceAxis,
    categoryImageId: a.categoryImageId,
    categoryImage: a.categoryImage,
  }));
}

export async function getArticleBySlug(slug: string) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      const article = await prisma.article.findUnique({
        where: { slug },
        include: {
          categoryImage: true,
          narrative: {
            include: {
              articles: {
                orderBy: { publishedAt: 'asc' },
              },
            },
          },
          entities: {
            include: {
              entity: true,
            },
            orderBy: {
              startOffset: 'asc',
            },
          },
        },
      });
      if (article) return article;
    } catch (e) {
      console.error(`Error fetching article by slug ${slug} from DB, using mock fallback.`, e);
    }
  }

  // Fallback to mock data
  const mockArt = mockArticles.find(a => a.slug === slug);
  if (!mockArt) return null;

  // If part of narrative, get all related articles chronologically
  let narrativeArticles: any[] = [];
  if (mockArt.narrativeId) {
    narrativeArticles = mockArticles
      .filter(a => a.narrativeId === mockArt.narrativeId)
      .map(a => ({
        id: a.id,
        headline: a.headline,
        slug: a.slug,
        publishedAt: a.publishedAt,
      }))
      .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
  }

  return {
    ...mockArt,
    narrative: mockArt.narrative
      ? {
          ...mockArt.narrative,
          articles: narrativeArticles,
        }
      : null,
  };
}

export async function getStanceVotes(articleId: string) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      const votes = await prisma.stanceVote.findMany({
        where: { articleId },
        select: { value: true },
      });
      return votes.map(v => v.value);
    } catch (e) {
      console.error(`Error fetching stance votes for ${articleId} from DB, using mock fallback.`, e);
    }
  }

  return mockStanceVotes[articleId] || [];
}

export async function getUserStanceVote(articleId: string, sessionId: string): Promise<number | null> {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      const vote = await prisma.stanceVote.findFirst({
        where: { articleId, sessionId }
      });
      return vote ? vote.value : null;
    } catch (e) {
      console.error(`Error fetching user stance vote from DB.`, e);
    }
  }
  return null;
}

export async function recordStanceVote(articleId: string, value: number, sessionId: string) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      const existingVote = await prisma.stanceVote.findFirst({
        where: {
          articleId,
          sessionId,
        },
      });
      if (existingVote) {
        return await prisma.stanceVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      } else {
        return await prisma.stanceVote.create({
          data: {
            articleId,
            value,
            sessionId,
          },
        });
      }
    } catch (e) {
      console.error(`Error recording stance vote in DB, using mock fallback.`, e);
    }
  }

  if (!mockStanceVotes[articleId]) {
    mockStanceVotes[articleId] = [];
  }
  mockStanceVotes[articleId].push(value);
  return { id: `mock-vote-${Date.now()}`, articleId, value, sessionId };
}

export async function getNarrativeThreads() {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      return await prisma.narrativeThread.findMany({
        include: {
          articles: {
            orderBy: { publishedAt: 'asc' },
          },
        },
      });
    } catch (e) {
      console.error('Error fetching narrative threads from DB.', e);
    }
  }

  // Mock fallback
  return mockNarratives.map(n => ({
    id: n.id,
    title: n.title,
    articles: mockArticles
      .filter(a => a.narrativeId === n.id)
      .map(a => ({
        id: a.id,
        headline: a.headline,
        slug: a.slug,
        publishedAt: a.publishedAt,
      })),
  }));
}

// Function to save new article (admin page)
export async function saveArticle(data: {
  headline: string;
  slug: string;
  body: string;
  category: string;
  sourceUrl?: string;
  publishedAt: Date;
  stanceAxis: { left: string; right: string };
  narrativeId?: string;
  newNarrativeTitle?: string;
  entities: Array<{
    name: string;
    aliases: string[];
    oneLiner: string;
    certainty: string;
    whyNow: string[];
    stakeholders: Array<{ name: string; wants: string }>;
    mentions: Array<{ startOffset: number; endOffset: number }>;
  }>;
}) {
  const catImg = await resolveCategoryImage(data.category);
  const dbConnected = await checkDbConnection();

  if (dbConnected) {
    try {
      const existing = await prisma.article.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new Error(`Article with slug ${data.slug} already exists.`);
      }

      const categoryEnum = data.category as Category;

      return await prisma.$transaction(async (tx) => {
        // Resolve or create category image record
        let dbCatImg = await tx.categoryImage.findUnique({
          where: { category: categoryEnum },
        });

        if (!dbCatImg) {
          dbCatImg = await tx.categoryImage.create({
            data: {
              category: categoryEnum,
              imageUrl: catImg.imageUrl,
              photographerName: catImg.photographerName,
              photographerUrl: catImg.photographerUrl,
            },
          });
        }

        // Handle narrative thread creation or linking
        let finalNarrativeId: string | null = null;
        if (data.newNarrativeTitle) {
          const nt = await tx.narrativeThread.create({
            data: { title: data.newNarrativeTitle }
          });
          finalNarrativeId = nt.id;
        } else if (data.narrativeId) {
          finalNarrativeId = data.narrativeId;
        }

        const article = await tx.article.create({
          data: {
            headline: data.headline,
            slug: data.slug,
            body: data.body,
            category: categoryEnum,
            sourceUrl: data.sourceUrl,
            publishedAt: data.publishedAt,
            stanceAxis: data.stanceAxis,
            categoryImageId: dbCatImg.id,
            narrativeId: finalNarrativeId,
          },
        });

        for (const ent of data.entities) {
          const entImg = await resolveEntityImage(ent.name);

          let entityRecord = await tx.entity.findUnique({
            where: { name: ent.name },
          });

          if (!entityRecord) {
            entityRecord = await tx.entity.create({
              data: {
                name: ent.name,
                aliases: ent.aliases,
                oneLiner: ent.oneLiner,
                certainty: ent.certainty,
                whyNow: ent.whyNow,
                stakeholders: ent.stakeholders,
                imageUrl: entImg.imageUrl,
                imageSource: entImg.imageSource,
                imageFetchedAt: new Date(),
              },
            });
          } else if (!entityRecord.imageUrl && entityRecord.imageSource !== 'none') {
            entityRecord = await tx.entity.update({
              where: { id: entityRecord.id },
              data: {
                imageUrl: entImg.imageUrl,
                imageSource: entImg.imageSource,
                imageFetchedAt: new Date(),
              },
            });
          }

          for (const mention of ent.mentions) {
            await tx.articleEntity.create({
              data: {
                articleId: article.id,
                entityId: entityRecord.id,
                startOffset: mention.startOffset,
                endOffset: mention.endOffset,
              },
            });
          }
        }

        return article;
      });
    } catch (e) {
      console.error('Error saving article to DB, adding to mock fallback in-memory.', e);
    }
  }

  // Fallback save to mock memory
  const newId = `article-${mockArticles.length + 1}`;

  // Build the category image in memory
  let memoryCatImg = mockCategoryImages[data.category];
  if (!memoryCatImg) {
    memoryCatImg = {
      id: `cat-img-${data.category}`,
      category: data.category,
      imageUrl: catImg.imageUrl,
      photographerName: catImg.photographerName,
      photographerUrl: catImg.photographerUrl,
      fetchedAt: new Date(),
    };
    mockCategoryImages[data.category] = memoryCatImg;
  }

  // Resolve narrative object for mock
  let mockNarrativeObj: any = null;
  if (data.newNarrativeTitle) {
    mockNarrativeObj = {
      id: `narrative-${Date.now()}`,
      title: data.newNarrativeTitle,
    };
    mockNarratives.push(mockNarrativeObj);
  } else if (data.narrativeId) {
    mockNarrativeObj = mockNarratives.find(n => n.id === data.narrativeId) || null;
  }

  const resolvedEntities = [];
  for (const e of data.entities) {
    let matched = mockEntities.find(me => me.name === e.name);
    if (!matched) {
      const entImg = await resolveEntityImage(e.name);
      matched = {
        id: `entity-${e.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: e.name,
        aliases: e.aliases,
        oneLiner: e.oneLiner,
        certainty: e.certainty,
        whyNow: e.whyNow,
        stakeholders: e.stakeholders,
        imageUrl: entImg.imageUrl,
        imageSource: entImg.imageSource,
        imageFetchedAt: new Date(),
      };
      mockEntities.push(matched);
    }
    resolvedEntities.push(matched);
  }

  const relationEntities: any[] = [];
  data.entities.forEach((ent, index) => {
    const matched = mockEntities.find(me => me.name === ent.name);
    ent.mentions.forEach((m, mIdx) => {
      relationEntities.push({
        id: `ae-${newId}-${index}-${mIdx}`,
        startOffset: m.startOffset,
        endOffset: m.endOffset,
        entityId: matched!.id,
        entity: matched!,
      });
    });
  });

  const newArticle = {
    id: newId,
    headline: data.headline,
    slug: data.slug,
    body: data.body,
    category: data.category,
    publishedAt: data.publishedAt,
    createdAt: new Date(),
    sourceUrl: data.sourceUrl || null,
    narrativeId: mockNarrativeObj ? mockNarrativeObj.id : null,
    narrative: mockNarrativeObj,
    stanceAxis: data.stanceAxis,
    categoryImageId: memoryCatImg.id,
    categoryImage: memoryCatImg,
    entities: relationEntities,
  };

  mockArticles.unshift(newArticle);
  mockStanceVotes[newId] = [];

  return newArticle;
}
