import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.stanceVote.deleteMany();
  await prisma.articleEntity.deleteMany();
  await prisma.article.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.narrativeThread.deleteMany();

  console.log('Seeding narrative thread...');
  const narrative = await prisma.narrativeThread.create({
    data: {
      title: 'Global Maritime & Border Security Summit 2026',
    },
  });

  console.log('Seeding entities...');
  const nato = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  const antalya = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  const mediterranean = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  const arcticCouncil = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  const tromso = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  const norway = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  const singapore = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  const malaccaStrait = await prisma.entity.create({
    data: {
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
      ]
    }
  });

  console.log('Seeding articles...');

  // Article 1
  const body1 = "Ministers from NATO gathered in Antalya, Turkey, this week to discuss regional stability and security cooperation. The conference, hosted by Turkish diplomats, aims to resolve disputes over maritime borders in the Mediterranean. Officials from the Alliance stated that the summit serves as a crucial platform to reinforce the security framework in Eastern Europe and the Middle East.";
  const art1 = await prisma.article.create({
    data: {
      headline: 'NATO Ministers Convene in Antalya to Address Mediterranean Security Concerns',
      slug: 'nato-ministers-convene-antalya-mediterranean',
      body: body1,
      category: 'geopolitics',
      publishedAt: new Date(),
      narrativeId: narrative.id,
      stanceAxis: { left: 'De-escalates', right: 'Escalates' },
    },
  });

  // Connect entities for Article 1
  // "NATO": 15 to 19
  await prisma.articleEntity.create({
    data: {
      articleId: art1.id,
      entityId: nato.id,
      startOffset: 15,
      endOffset: 19,
    },
  });
  // "Antalya": 32 to 39
  await prisma.articleEntity.create({
    data: {
      articleId: art1.id,
      entityId: antalya.id,
      startOffset: 32,
      endOffset: 39,
    },
  });
  // "Mediterranean": 188 to 201
  await prisma.articleEntity.create({
    data: {
      articleId: art1.id,
      entityId: mediterranean.id,
      startOffset: 188,
      endOffset: 201,
    },
  });
  // "Alliance" (alias of NATO): 221 to 229
  await prisma.articleEntity.create({
    data: {
      articleId: art1.id,
      entityId: nato.id,
      startOffset: 221,
      endOffset: 229,
    },
  });

  // Article 2
  const body2 = "The Arctic Council meeting in Tromsø concluded yesterday without a joint statement, highlighting deep disagreements over mineral exploration. Norway, representing the current chair, attempted to broker a compromise on resource extraction boundaries, but representatives from Russia and the United States remained divided on environmental regulations. Observers note that the failure to reach consensus signals a growing militarization and economic rivalry in the polar region.";
  const art2 = await prisma.article.create({
    data: {
      headline: 'Arctic Council Deadlock: Tromsø Summit Ends Without Accord',
      slug: 'arctic-council-deadlock-tromso-summit-fails',
      body: body2,
      category: 'geopolitics',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      stanceAxis: { left: 'Diplomatic De-escalation', right: 'Militarization/Conflict' },
    },
  });

  // "Arctic Council": 4 to 18
  await prisma.articleEntity.create({
    data: {
      articleId: art2.id,
      entityId: arcticCouncil.id,
      startOffset: 4,
      endOffset: 18,
    },
  });
  // "Tromsø": 30 to 36
  await prisma.articleEntity.create({
    data: {
      articleId: art2.id,
      entityId: tromso.id,
      startOffset: 30,
      endOffset: 36,
    },
  });
  // "Norway": 105 to 111
  await prisma.articleEntity.create({
    data: {
      articleId: art2.id,
      entityId: norway.id,
      startOffset: 105,
      endOffset: 111,
    },
  });

  // Article 3
  const body3 = "Singapore, Malaysia, and Indonesia have launched a series of joint naval exercises in the Strait of Malacca. The initiative, codenamed Operation Malacca Shield, is designed to deter piracy and address insurance premium surges. Insurance giants in London have recently classified the channel as a high-risk zone, causing maritime transport firms to demand state-backed escorts.";
  const art3 = await prisma.article.create({
    data: {
      headline: 'Trilateral Patrols Initiated in the Strait of Malacca Amid Shipping Fears',
      slug: 'trilateral-patrols-initiated-strait-malacca',
      body: body3,
      category: 'geopolitics',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      narrativeId: narrative.id,
      stanceAxis: { left: 'Stabilizes Shipping', right: 'Heightens Regional Tensions' },
    },
  });

  // "Singapore": 0 to 9
  await prisma.articleEntity.create({
    data: {
      articleId: art3.id,
      entityId: singapore.id,
      startOffset: 0,
      endOffset: 9,
    },
  });
  // "Strait of Malacca": 104 to 121
  await prisma.articleEntity.create({
    data: {
      articleId: art3.id,
      entityId: malaccaStrait.id,
      startOffset: 104,
      endOffset: 121,
    },
  });
  // "channel" (alias of Strait of Malacca): 217 to 224
  await prisma.articleEntity.create({
    data: {
      articleId: art3.id,
      entityId: malaccaStrait.id,
      startOffset: 217,
      endOffset: 224,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
