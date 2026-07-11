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
      { name: 'International Shipping Association', wants: 'Enhanced security and reduction of shipping risk premiums' },
      { name: 'Indonesia & Malaysia', wants: 'Maintenance of sovereignty over the waters while securing trade routes' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-parliament',
    name: 'Parliament',
    aliases: ['Parliament of India', 'Lok Sabha'],
    oneLiner: 'The supreme legislative body of the Republic of India, comprising the President and two houses.',
    certainty: 'confirmed',
    whyNow: [
      'Debating crucial updates regarding data security and technology startup guidelines.',
      'Upcoming winter session scheduled to address federal resource budgets.'
    ],
    stakeholders: [
      { name: 'Indian Citizens', wants: 'Robust personal data privacy safeguards and national cybersecurity' }
    ],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Parliament_House_New_Delhi.jpg/400px-Parliament_House_New_Delhi.jpg',
    imageSource: 'wikidata',
    imageFetchedAt: new Date()
  },
  {
    id: 'entity-nasdaq',
    name: 'NASDAQ',
    aliases: ['NASDAQ stock exchange'],
    oneLiner: 'An American stock exchange based in New York City, the second-largest exchange in the world by market capitalization.',
    certainty: 'confirmed',
    whyNow: [
      'Surge in automated trading index volumes signals tech sector rally.',
      'Increased scrutiny on high-frequency trading algorithm guidelines.'
    ],
    stakeholders: [
      { name: 'Tech Corporations', wants: 'Access to investment capital and stable market liquidity' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-wembley',
    name: 'Wembley',
    aliases: ['Wembley Stadium'],
    oneLiner: 'A historic sports stadium in London, England, serving as the home of English association football.',
    certainty: 'confirmed',
    whyNow: [
      'Hosting major tournament finals generating high international broadcast volumes.',
      'Renovations planned to expand viewer capacity and transit infrastructure.'
    ],
    stakeholders: [
      { name: 'Football Association', wants: 'Maximizing gate revenue and ensuring crowd security standards' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-cannes',
    name: 'Cannes',
    aliases: ['Cannes Film Festival'],
    oneLiner: 'An annual film festival held in Cannes, France, which previews new films of all genres from around the world.',
    certainty: 'confirmed',
    whyNow: [
      'Announces groundbreaking stage lineup focusing on independent filmmakers.',
      'Cultural shift towards character-driven narrative distribution streams.'
    ],
    stakeholders: [
      { name: 'Independent Filmmakers', wants: 'Distribution deals and international critical recognition' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-isro',
    name: 'ISRO',
    aliases: ['Indian Space Research Organisation'],
    oneLiner: 'The national space agency of India, headquartered in Bengaluru, key to domestic space sector advancement.',
    certainty: 'confirmed',
    whyNow: [
      'Launches three communication satellites into geosynchronous orbit.',
      'Expanding satellite internet coverage to rural regional communities.'
    ],
    stakeholders: [
      { name: 'ISRO Spacecraft Command', wants: 'Successful deployment and orbital slot security' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-stadium',
    name: 'Stadium',
    aliases: ['Roland Garros', 'Tennis Stadium'],
    oneLiner: 'A premium sports stadium in Paris, France, hosting the prestigious grand slam tennis championships.',
    certainty: 'confirmed',
    whyNow: [
      'Staging high-intensity matches under extreme summer heat waves.',
      'Player disputes over scheduling and rest periods between matches.'
    ],
    stakeholders: [
      { name: 'Tournament Directors', wants: 'Staging broadcast schedules on-time and managing spectator flows' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  },
  {
    id: 'entity-festival',
    name: 'VR Festival',
    aliases: ['Virtual Reality Film Festival'],
    oneLiner: 'A modern media festival showcasing virtual reality and immersive storytelling media.',
    certainty: 'official statement',
    whyNow: [
      'Inaugural launch in Mumbai showcases interactive media technologies.',
      'Independent creators exploring choosing narratives using headwear.'
    ],
    stakeholders: [
      { name: 'VR Creators', wants: 'Technological platforms to distribute virtual content formats' }
    ],
    imageUrl: null,
    imageSource: 'none',
    imageFetchedAt: null
  }
];

// Helper to create mock entity mention offsets dynamically on load
function createMockMention(entityId: string, text: string, body: string, entity: any) {
  const index = body.toLowerCase().indexOf(text.toLowerCase());
  return {
    id: `ae-mock-${entityId}-${index}-${Math.floor(Math.random() * 1000)}`,
    startOffset: index !== -1 ? index : 0,
    endOffset: index !== -1 ? index + text.length : 0,
    entityId,
    entity
  };
}

// Bodies defined to be ~60 words.
const body1 = "Antalya, Turkey — Ministers from NATO convened a special security summit in Antalya to discuss Mediterranean security and resolve maritime border disputes. The talks, mediated by regional diplomats, focused on de-escalating military naval deployments and establishing a joint communications framework to prevent accidental confrontations in international shipping lanes.";
const body2 = "New Delhi — The Indian Parliament introduced a draft amendment to the Digital Personal Data Protection Act, aiming to simplify compliance procedures for early-stage technology startups. While government representatives argue the bill encourages innovation, opposition leaders express concerns regarding potential exemptions granted to state agencies, sparking a national debate on citizen privacy and surveillance.";
const body3 = "New York — Major stock exchanges witnessed a wave of automated trading index adjustments as institutional investors shifted capital toward NASDAQ automation conglomerates. Economists signal this trend indicates a structural realignment in industrial manufacturing and software sectors, predicting long-term productivity boosts but warning of temporary white-collar labor displacement across service-oriented businesses.";
const body4 = "London — Wembley Stadium witnessed one of the greatest upsets in modern tournament history as the underdog team secured a dramatic victory in the championship final. Analyzing analysts had predicted a comfortable victory for the tournament favorites, but a disciplined defense and two late counter-attacks secured the championship trophy for the challengers, igniting wild celebrations.";
const body5 = "Cannes — Organizers of the Cannes Film Festival unveiled a groundbreaking stage lineup focusing entirely on independent filmmakers working outside traditional studio systems. The selection features experimental narratives, documentary formats, and low-budget productions, highlighting a shift in audience preferences towards authentic, character-driven storytelling over high-budget commercial releases.";
const body6 = "Tromsø — High-level diplomats representing Norway and Russia held bilateral talks in the Arctic circle city of Tromsø to discuss maritime borders and resource claims. Amid melting polar ice caps opening new transit routes, both nations sought agreements on shipping corridors and environmental protection zones, balancing sovereign energy security interests with regional stability.";
const body7 = "Bengaluru — The Indian Space Research Organisation (ISRO) successfully deployed three next-generation communication satellites into geosynchronous orbit. Launching from the Sriharikota spaceport, the mission aims to expand broadband internet connectivity to rural and remote regions of the country, marking a major milestone in India’s domestic space sector expansion.";
const body8 = "Singapore — Global semiconductor supply chains are stabilizing as manufacturing plants in Singapore and neighboring Southeast Asian hubs complete major factory expansions. The increased production capacity is expected to resolve prolonged chip shortages affecting automotive and consumer electronics markets, lowering component costs and boosting manufacturing output heading into the third quarter.";
const body9 = "Paris — The defending champion advanced to the grand slam tennis semi-finals after a grueling five-set victory lasting over four hours at the stadium. Defying physical fatigue, the top-ranked athlete secured key tiebreaker points in the final set, defeating a formidable challenger who pushed the match to the absolute limit under extreme summer heat.";
const body10 = "Mumbai — A brand new Virtual Reality Film Festival launched in Mumbai this week, showcasing interactive storytelling projects from filmmakers across Asia. Attendees experienced immersive films using headsets, allowing viewers to choose narrative paths and interact with digital environments, signaling a new frontier in media consumption and independent content creation.";

const mockArticles: any[] = [
  {
    id: 'article-1',
    headline: 'NATO Ministers Convene in Antalya to Address Mediterranean Security Concerns',
    slug: 'nato-ministers-convene-antalya-mediterranean',
    body: body1,
    category: 'geopolitics',
    publishedAt: new Date(),
    createdAt: new Date(),
    sourceUrl: 'https://www.reuters.com/world/europe/nato-mediterranean-security-antalya',
    sourceName: 'Reuters News',
    sourceCountry: 'Global',
    narrativeId: 'narrative-1',
    narrative: mockNarrative,
    stanceAxis: { left: 'De-escalates', right: 'Escalates' },
    categoryImageId: 'cat-img-geopolitics',
    categoryImage: mockCategoryImages['geopolitics'],
    entities: [
      createMockMention('entity-nato', 'NATO', body1, mockEntities[0]),
      createMockMention('entity-antalya', 'Antalya', body1, mockEntities[1]),
      createMockMention('entity-mediterranean', 'Mediterranean', body1, mockEntities[2]),
    ]
  },
  {
    id: 'article-2',
    headline: 'Indian Parliament Proposes Digital Personal Data Protection Act Amendments',
    slug: 'indian-parliament-proposes-data-act-amendments',
    body: body2,
    category: 'national',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sourceUrl: 'https://www.thehindu.com/news/national/parliament-personal-data-amendments',
    sourceName: 'The Hindu',
    sourceCountry: 'India',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Positive for the public', right: 'Concerning for the public' },
    categoryImageId: 'cat-img-domestic-politics',
    categoryImage: mockCategoryImages['national'],
    entities: [
      createMockMention('entity-parliament', 'Parliament', body2, mockEntities[8]),
    ]
  },
  {
    id: 'article-3',
    headline: 'Global Markets Recoil as Tech Influx Signals Automation Shift',
    slug: 'global-markets-recoil-tech-influx-automation',
    body: body3,
    category: 'business',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://economictimes.indiatimes.com/markets/stocks/global-markets-tech-automation',
    sourceName: 'Economic Times',
    sourceCountry: 'India',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Bearish', right: 'Bullish' },
    categoryImageId: 'cat-img-economy',
    categoryImage: mockCategoryImages['business'],
    entities: [
      createMockMention('entity-nasdaq', 'NASDAQ', body3, mockEntities[9]),
    ]
  },
  {
    id: 'article-4',
    headline: 'Championship Final: Underdog Victory Stuns Wembley Stadium Crowd',
    slug: 'championship-final-underdog-victory-wembley',
    body: body4,
    category: 'sports',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://www.espn.com/football/story/wembley-underdog-championship-final',
    sourceName: 'ESPN Cricinfo',
    sourceCountry: 'Global',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Underdog wins', right: 'Favorite wins' },
    categoryImageId: 'cat-img-sports',
    categoryImage: mockCategoryImages['sports'],
    entities: [
      createMockMention('entity-wembley', 'Wembley', body4, mockEntities[10]),
    ]
  },
  {
    id: 'article-5',
    headline: 'Cannes Film Festival Announces Groundbreaking Independent Stage Lineup',
    slug: 'cannes-film-festival-announces-independent-lineup',
    body: body5,
    category: 'entertainment',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://www.hindustantimes.com/entertainment/cannes-film-festival-independent-lineup',
    sourceName: 'Hindustan Times Ent',
    sourceCountry: 'India',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Underwhelming', right: 'Lives up to the hype' },
    categoryImageId: 'cat-img-entertainment',
    categoryImage: mockCategoryImages['entertainment'],
    entities: [
      createMockMention('entity-cannes', 'Cannes', body5, mockEntities[11]),
    ]
  },
  {
    id: 'article-6',
    headline: 'Diplomatic Envoys Hold Bilateral Arctic Borders Dialogue in Tromsø',
    slug: 'diplomatic-envoys-bilateral-arctic-borders-tromso',
    body: body6,
    category: 'geopolitics',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    sourceUrl: 'https://www.aljazeera.com/news/world/arctic-borders-diplomatic-talks-tromso',
    sourceName: 'Al Jazeera',
    sourceCountry: 'Qatar',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'De-escalates', right: 'Escalates' },
    categoryImageId: 'cat-img-geopolitics',
    categoryImage: mockCategoryImages['geopolitics'],
    entities: [
      createMockMention('entity-norway', 'Norway', body6, mockEntities[5]),
      createMockMention('entity-tromso', 'Tromsø', body6, mockEntities[4]),
      createMockMention('entity-arctic-council', 'Arctic', body6, mockEntities[3]),
    ]
  },
  {
    id: 'article-7',
    headline: 'ISRO Deploys Next-Gen Broadband Communication Satellites Into Orbit',
    slug: 'isro-deploys-next-gen-broadband-satellites-orbit',
    body: body7,
    category: 'national',
    publishedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5h ago
    createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
    sourceUrl: 'https://indianexpress.com/article/technology/science/isro-communication-satellites-launch',
    sourceName: 'Indian Express',
    sourceCountry: 'India',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Positive for the public', right: 'Concerning for the public' },
    categoryImageId: 'cat-img-domestic-politics',
    categoryImage: mockCategoryImages['national'],
    entities: [
      createMockMention('entity-isro', 'ISRO', body7, mockEntities[12]),
    ]
  },
  {
    id: 'article-8',
    headline: 'Semiconductor Supply Chains Stabilize as Singapore Factories Expand',
    slug: 'semiconductor-supply-chains-stabilize-singapore-expand',
    body: body8,
    category: 'business',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    sourceUrl: 'https://www.livemint.com/news/world/semiconductor-supply-chains-stabilize-singapore',
    sourceName: 'Livemint',
    sourceCountry: 'India',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Bearish', right: 'Bullish' },
    categoryImageId: 'cat-img-economy',
    categoryImage: mockCategoryImages['business'],
    entities: [
      createMockMention('entity-singapore', 'Singapore', body8, mockEntities[6]),
      createMockMention('entity-malacca-strait', 'Singapore', body8, mockEntities[7]),
    ]
  },
  {
    id: 'article-9',
    headline: 'Defending Champion Secures Paris Grand Slam Semi-Final Slot',
    slug: 'defending-champion-secures-paris-grand-slam-semi-final',
    body: body9,
    category: 'sports',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    sourceUrl: 'https://www.thehindu.com/sport/tennis/paris-grand-slam-championship-victory',
    sourceName: 'The Hindu Sport',
    sourceCountry: 'India',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Underdog wins', right: 'Favorite wins' },
    categoryImageId: 'cat-img-sports',
    categoryImage: mockCategoryImages['sports'],
    entities: [
      createMockMention('entity-stadium', 'Stadium', body9, mockEntities[13]),
    ]
  },
  {
    id: 'article-10',
    headline: 'Virtual Reality Film Festival Launches Interactive Showcase in Mumbai',
    slug: 'virtual-reality-film-festival-launches-mumbai',
    body: body10,
    category: 'entertainment',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    sourceUrl: 'https://indianexpress.com/article/entertainment/bollywood/mumbai-virtual-reality-film-festival',
    sourceName: 'Indian Express Ent',
    sourceCountry: 'India',
    narrativeId: null,
    narrative: null,
    stanceAxis: { left: 'Underwhelming', right: 'Lives up to the hype' },
    categoryImageId: 'cat-img-entertainment',
    categoryImage: mockCategoryImages['entertainment'],
    entities: [
      createMockMention('entity-festival', 'VR Festival', body10, mockEntities[14]),
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
  'article-6': [20, 30, 40, 50, 60],
  'article-7': [70, 75, 80, 85],
  'article-8': [40, 45, 50, 55, 60],
  'article-9': [10, 15, 20, 25, 30],
  'article-10': [60, 65, 70, 75, 80]
};

// In-memory opinions fallback
const mockOpinions: Record<string, any[]> = {
  'article-1': [
    { id: 'op-1', articleId: 'article-1', body: 'Strategic security talks are essential for keeping regional corridors open.', sessionId: 'mock-session-1', status: 'approved', createdAt: new Date(Date.now() - 3600000) },
    { id: 'op-2', articleId: 'article-1', body: 'Turkey’s diplomatic leadership during this summit will be critical.', sessionId: 'mock-session-2', status: 'approved', createdAt: new Date(Date.now() - 7200000) }
  ]
};

// In-memory subscriptions fallback
const mockSubscriptions: any[] = [];

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
    sourceName: a.sourceName,
    sourceCountry: a.sourceCountry,
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

export async function getApprovedOpinions(articleId: string) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      return await prisma.opinion.findMany({
        where: { articleId, status: 'approved' },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      console.error('Error fetching opinions from DB.', e);
    }
  }

  // Mock fallback
  if (!mockOpinions[articleId]) {
    mockOpinions[articleId] = [];
  }
  return mockOpinions[articleId].filter(o => o.status === 'approved');
}

export async function saveOpinion(articleId: string, body: string, sessionId: string, status: string) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      // Rate limit check: One opinion per article per session
      const existing = await prisma.opinion.findFirst({
        where: { articleId, sessionId }
      });
      if (existing) {
        throw new Error('You have already submitted an opinion for this article.');
      }

      return await prisma.opinion.create({
        data: {
          articleId,
          body,
          sessionId,
          status
        }
      });
    } catch (e: any) {
      console.error('Error saving opinion to DB.', e);
      throw e;
    }
  }

  // Mock fallback
  if (!mockOpinions[articleId]) {
    mockOpinions[articleId] = [];
  }
  const existing = mockOpinions[articleId].find(o => o.sessionId === sessionId);
  if (existing) {
    throw new Error('You have already submitted an opinion for this article.');
  }

  const newOpinion = {
    id: `mock-op-${Date.now()}`,
    articleId,
    body,
    sessionId,
    status,
    createdAt: new Date()
  };
  mockOpinions[articleId].push(newOpinion);
  return newOpinion;
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
  sourceName?: string;
  sourceCountry?: string;
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
  // Deduplicate against sourceUrl first
  if (data.sourceUrl) {
    const dbConnected = await checkDbConnection();
    if (dbConnected) {
      const existingUrl = await prisma.article.findUnique({
        where: { sourceUrl: data.sourceUrl }
      });
      if (existingUrl) {
        throw new Error(`Article with sourceUrl ${data.sourceUrl} already exists.`);
      }
    } else {
      const existingUrl = mockArticles.find(a => a.sourceUrl === data.sourceUrl);
      if (existingUrl) {
        throw new Error(`Article with sourceUrl ${data.sourceUrl} already exists.`);
      }
    }
  }

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
            sourceName: data.sourceName,
            sourceCountry: data.sourceCountry,
            publishedAt: data.publishedAt,
            stanceAxis: data.stanceAxis,
            categoryImageId: dbCatImg.id,
            narrativeId: finalNarrativeId,
          },
        });

        for (const ent of data.entities) {
          const entImg = await resolveEntityImage(ent.name, data.category);

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
      const entImg = await resolveEntityImage(e.name, data.category);
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
    sourceName: data.sourceName || null,
    sourceCountry: data.sourceCountry || null,
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

export async function logIngestionRun(feedsChecked: number, newArticles: number, skipped: number, errors: any) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      return await prisma.ingestionLog.create({
        data: {
          feedsChecked,
          newArticles,
          skipped,
          errors: errors ? (errors as any) : undefined
        }
      });
    } catch (e) {
      console.error('Error writing IngestionLog to DB:', e);
    }
  }
  console.log(`[INGESTION LOG] Feeds checked: ${feedsChecked}, new: ${newArticles}, skipped: ${skipped}, errors:`, errors);
  return null;
}

export async function savePushSubscription(endpoint: string, keys: any, categories: string[]) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      return await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: { keys, categories },
        create: { endpoint, keys, categories }
      });
    } catch (e) {
      console.error('Error saving PushSubscription to DB:', e);
    }
  }

  // Fallback to memory
  const idx = mockSubscriptions.findIndex(s => s.endpoint === endpoint);
  if (idx !== -1) {
    mockSubscriptions[idx] = { endpoint, keys, categories, createdAt: new Date() };
  } else {
    mockSubscriptions.push({ id: `sub-${Date.now()}`, endpoint, keys, categories, createdAt: new Date() });
  }
  return mockSubscriptions;
}

export async function deletePushSubscription(endpoint: string) {
  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    try {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint }
      });
    } catch (e) {
      console.error('Error deleting expired PushSubscription from DB:', e);
    }
  }

  // Fallback to memory
  const idx = mockSubscriptions.findIndex(s => s.endpoint === endpoint);
  if (idx !== -1) {
    mockSubscriptions.splice(idx, 1);
  }
}

export async function getPushSubscriptions(category?: string) {
  const dbConnected = await checkDbConnection();
  let subs = [];
  if (dbConnected) {
    try {
      subs = await prisma.pushSubscription.findMany();
    } catch (e) {
      console.error('Error querying PushSubscriptions from DB:', e);
    }
  } else {
    subs = mockSubscriptions;
  }

  if (category) {
    return subs.filter((s: any) => s.categories.length === 0 || s.categories.includes(category));
  }
  return subs;
}
