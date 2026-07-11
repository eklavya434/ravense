import { prisma } from './db';
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
  'domestic-politics': {
    id: 'cat-img-domestic-politics',
    category: 'domestic-politics',
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Kyle Glenn",
    photographerUrl: "https://unsplash.com/@kyleglenn",
    fetchedAt: new Date()
  },
  'economy': {
    id: 'cat-img-economy',
    category: 'economy',
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    photographerName: "M. B. M.",
    photographerUrl: "https://unsplash.com/@mbm",
    fetchedAt: new Date()
  },
  'macroeconomics': {
    id: 'cat-img-macroeconomics',
    category: 'macroeconomics',
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    photographerName: "M. B. M.",
    photographerUrl: "https://unsplash.com/@mbm",
    fetchedAt: new Date()
  },
  'security': {
    id: 'cat-img-security',
    category: 'security',
    imageUrl: "https://images.unsplash.com/photo-1508847154043-be12a62861c1?auto=format&fit=crop&w=1200&q=80",
    photographerName: "Sven-Erik Arndt",
    photographerUrl: "https://unsplash.com/@sven-erik-arndt",
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
    body: 'Ministers from NATO gathered in Antalya, Turkey, this week to discuss regional stability and security cooperation. The conference, hosted by Turkish diplomats, aims to resolve disputes over maritime borders in the Mediterranean. Officials from the Alliance stated that the summit serves as a crucial platform to reinforce the security framework in Eastern Europe and the Middle East.',
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
      { id: 'ae-1-3', startOffset: 188, endOffset: 201, entityId: 'entity-mediterranean', entity: mockEntities[2] },
      { id: 'ae-1-4', startOffset: 221, endOffset: 229, entityId: 'entity-nato', entity: mockEntities[0] },
    ]
  },
  {
    id: 'article-2',
    headline: 'Arctic Council Deadlock: Tromsø Summit Ends Without Accord',
    slug: 'arctic-council-deadlock-tromso-summit-fails',
    body: 'The Arctic Council meeting in Tromsø concluded yesterday without a joint statement, highlighting deep disagreements over mineral exploration. Norway, representing the current chair, attempted to broker a compromise on resource extraction boundaries, but representatives from Russia and the United States remained divided on environmental regulations. Observers note that the failure to reach consensus signals a growing militarization and economic rivalry in the polar region.',
    category: 'geopolitics',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/arctic-tromso',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Diplomatic De-escalation', right: 'Militarization/Conflict' },
    categoryImageId: 'cat-img-geopolitics',
    categoryImage: mockCategoryImages['geopolitics'],
    entities: [
      { id: 'ae-2-1', startOffset: 4, endOffset: 18, entityId: 'entity-arctic-council', entity: mockEntities[3] },
      { id: 'ae-2-2', startOffset: 30, endOffset: 36, entityId: 'entity-tromso', entity: mockEntities[4] },
      { id: 'ae-2-3', startOffset: 105, endOffset: 111, entityId: 'entity-norway', entity: mockEntities[5] },
    ]
  },
  {
    id: 'article-3',
    headline: 'Trilateral Patrols Initiated in the Strait of Malacca Amid Shipping Fears',
    slug: 'trilateral-patrols-initiated-strait-malacca',
    body: 'Singapore, Malaysia, and Indonesia have launched a series of joint naval exercises in the Strait of Malacca. The initiative, codenamed Operation Malacca Shield, is designed to deter piracy and address piracy and insurance premium surges. Insurance giants in London have recently classified the channel as a high-risk zone, causing maritime transport firms to demand state-backed escorts.',
    category: 'geopolitics',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/malacca-patrols',
    narrativeId: 'narrative-1',
    narrative: mockNarrative,
    stanceAxis: { left: 'Stabilizes Shipping', right: 'Heightens Regional Tensions' },
    categoryImageId: 'cat-img-geopolitics',
    categoryImage: mockCategoryImages['geopolitics'],
    entities: [
      { id: 'ae-3-1', startOffset: 0, endOffset: 9, entityId: 'entity-singapore', entity: mockEntities[6] },
      { id: 'ae-3-2', startOffset: 104, endOffset: 121, entityId: 'entity-malacca-strait', entity: mockEntities[7] },
      { id: 'ae-3-3', startOffset: 217, endOffset: 224, entityId: 'entity-malacca-strait', entity: mockEntities[7] },
    ]
  }
];

// In-memory stance votes fallback
const mockStanceVotes: Record<string, number[]> = {
  'article-1': [10, 20, 30, 45, 60, 62, 70, 75, 80],
  'article-2': [80, 85, 90, 75, 95, 65, 88],
  'article-3': [40, 45, 50, 55, 60, 48, 52],
};

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

// Function to save new article (admin page)
export async function saveArticle(data: {
  headline: string;
  slug: string;
  body: string;
  category: string;
  sourceUrl?: string;
  publishedAt: Date;
  stanceAxis: { left: string; right: string };
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
  // 1. Resolve Category Image (via Unsplash API or fallback)
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

      return await prisma.$transaction(async (tx) => {
        // Resolve or create category image record
        let dbCatImg = await tx.categoryImage.findUnique({
          where: { category: data.category },
        });

        if (!dbCatImg) {
          dbCatImg = await tx.categoryImage.create({
            data: {
              category: data.category,
              imageUrl: catImg.imageUrl,
              photographerName: catImg.photographerName,
              photographerUrl: catImg.photographerUrl,
            },
          });
        }

        const article = await tx.article.create({
          data: {
            headline: data.headline,
            slug: data.slug,
            body: data.body,
            category: data.category,
            sourceUrl: data.sourceUrl,
            publishedAt: data.publishedAt,
            stanceAxis: data.stanceAxis,
            categoryImageId: dbCatImg.id,
          },
        });

        for (const ent of data.entities) {
          // Resolve entity image (via Wikidata API or fallback)
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
            // Update entity image if it was previously missing
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

  const resolvedEntities = [];
  for (const e of data.entities) {
    let matched = mockEntities.find(me => me.name === e.name);
    if (!matched) {
      // Resolve entity image
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
    narrativeId: null,
    narrative: null,
    stanceAxis: data.stanceAxis,
    categoryImageId: memoryCatImg.id,
    categoryImage: memoryCatImg,
    entities: relationEntities,
  };

  mockArticles.unshift(newArticle);
  mockStanceVotes[newId] = [];

  return newArticle;
}
