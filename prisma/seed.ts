import { PrismaClient, Category } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.stanceVote.deleteMany();
  await prisma.articleEntity.deleteMany();
  await prisma.article.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.categoryImage.deleteMany();
  await prisma.narrativeThread.deleteMany();

  console.log('Seeding narrative thread...');
  const narrative = await prisma.narrativeThread.create({
    key: 'narrative-global-2026',
    data: {
      title: 'Global Maritime & Border Security Summit 2026',
    },
  } as any);

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

  const parliament = await prisma.entity.create({
    data: {
      name: 'Indian Parliament',
      aliases: ['Parliament'],
      oneLiner: 'The supreme legislative body of the Republic of India, responsible for passing laws and policies.',
      certainty: 'official statement',
      whyNow: [
        'Debating digital personal data legislation amendments.',
        'Heightened debate over compliance rules for early-stage companies.'
      ],
      stakeholders: [
        { name: 'Tech Advocates', wants: 'Fewer regulatory hurdles and clear compliance maps for startups' }
      ]
    }
  });

  const nasdaq = await prisma.entity.create({
    data: {
      name: 'NASDAQ',
      aliases: ['NASDAQ exchange'],
      oneLiner: 'An American stock exchange, the second-largest exchange in the world by market capitalization.',
      certainty: 'confirmed',
      whyNow: [
        'Registering record-high technology investments.',
        'Signals automation shifts across global manufacturing firms.'
      ],
      stakeholders: [
        { name: 'Financial Analysts', wants: 'Prevention of valuation bubbles while scaling up automation' }
      ]
    }
  });

  const wembley = await prisma.entity.create({
    data: {
      name: 'Wembley Stadium',
      aliases: ['Wembley'],
      oneLiner: 'A premier national sports stadium in Wembley, London, which opened in 2007, hosting major football and athletic events.',
      certainty: 'confirmed',
      whyNow: [
        'Hosting the championship final and witnessing historic underdog wins.',
        'Central stage for European domestic sport events.'
      ],
      stakeholders: [
        { name: 'Coaching Staff', wants: 'Winning titles by deploying innovative tactical shifts' }
      ]
    }
  });

  const cannes = await prisma.entity.create({
    data: {
      name: 'Cannes Film Festival',
      aliases: ['Cannes'],
      oneLiner: 'An annual film festival held in Cannes, France, which previews new films of all genres, including documentaries.',
      certainty: 'official statement',
      whyNow: [
        'Unveiling the independent cinema lineup for this season.',
        'Promoting diverse narrative formats over mainstream releases.'
      ],
      stakeholders: [
        { name: 'Film Curators', wants: 'Inclusion of innovative directors and independent film features' }
      ]
    }
  });

  console.log('Seeding CategoryImages...');
  // Geopolitics Category Image
  const imgGeo = await prisma.categoryImage.create({
    data: {
      category: Category.geopolitics,
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
      photographerName: "Joakim Honkasalo",
      photographerUrl: "https://unsplash.com/@jhonkasalo"
    }
  });
  
  // National Category Image
  const imgNat = await prisma.categoryImage.create({
    data: {
      category: Category.national,
      imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80",
      photographerName: "Kyle Glenn",
      photographerUrl: "https://unsplash.com/@kyleglenn"
    }
  });

  // Business Category Image
  const imgBus = await prisma.categoryImage.create({
    data: {
      category: Category.business,
      imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
      photographerName: "M. B. M.",
      photographerUrl: "https://unsplash.com/@mbm"
    }
  });

  // Sports Category Image
  const imgSpo = await prisma.categoryImage.create({
    data: {
      category: Category.sports,
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
      photographerName: "Conor Luddy",
      photographerUrl: "https://unsplash.com/@conorluddy"
    }
  });

  // Entertainment Category Image
  const imgEnt = await prisma.categoryImage.create({
    data: {
      category: Category.entertainment,
      imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
      photographerName: "Krists Luhaers",
      photographerUrl: "https://unsplash.com/@krists"
    }
  });

  console.log('Seeding articles...');

  // 1. Geopolitics
  const body1 = "Ministers from NATO gathered in Antalya, Turkey, this week to discuss regional stability and security cooperation. The conference, hosted by Turkish diplomats, aims to resolve disputes over maritime borders in the Mediterranean.";
  const art1 = await prisma.article.create({
    data: {
      headline: 'NATO Ministers Convene in Antalya to Address Mediterranean Security Concerns',
      slug: 'nato-ministers-convene-antalya-mediterranean',
      body: body1,
      category: Category.geopolitics,
      publishedAt: new Date(),
      stanceAxis: { left: 'De-escalates', right: 'Escalates' },
      categoryImageId: imgGeo.id,
    },
  });
  await prisma.articleEntity.create({
    data: { articleId: art1.id, entityId: nato.id, startOffset: 15, endOffset: 19 },
  });
  await prisma.articleEntity.create({
    data: { articleId: art1.id, entityId: antalya.id, startOffset: 32, endOffset: 39 },
  });

  // 2. National
  const body2 = "New Delhi — The Indian Parliament debated amendments to the Digital Personal Data Protection Act. Officials stated the revisions aim to streamline compliance for startups.";
  const art2 = await prisma.article.create({
    data: {
      headline: 'Indian Parliament Proposes Digital Personal Data Protection Act Amendments',
      slug: 'indian-parliament-proposes-data-act-amendments',
      body: body2,
      category: Category.national,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      stanceAxis: { left: 'Positive for the public', right: 'Concerning for the public' },
      categoryImageId: imgNat.id,
    },
  });
  await prisma.articleEntity.create({
    data: { articleId: art2.id, entityId: parliament.id, startOffset: 16, endOffset: 33 },
  });

  // 3. Business
  const body3 = "Silicon Valley — Tech firms at the NASDAQ stock exchange registered record-high investments, signaling a major automation shift.";
  const art3 = await prisma.article.create({
    data: {
      headline: 'Global Markets Recoil as Tech Influx Signals Automation Shift',
      slug: 'global-markets-recoil-tech-influx-automation',
      body: body3,
      category: Category.business,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      stanceAxis: { left: 'Bearish', right: 'Bullish' },
      categoryImageId: imgBus.id,
    },
  });
  await prisma.articleEntity.create({
    data: { articleId: art3.id, entityId: nasdaq.id, startOffset: 23, endOffset: 29 },
  });

  // 4. Sports
  const body4 = "London — The Wembley Stadium final ended in a historic victory yesterday, defying predictions from sports analysts.";
  const art4 = await prisma.article.create({
    data: {
      headline: 'Championship Final: Underdog Victory Stuns Wembley Stadium Crowd',
      slug: 'championship-final-underdog-victory-wembley',
      body: body4,
      category: Category.sports,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      stanceAxis: { left: 'Underdog wins', right: 'Favorite wins' },
      categoryImageId: imgSpo.id,
    },
  });
  await prisma.articleEntity.create({
    data: { articleId: art4.id, entityId: wembley.id, startOffset: 13, endOffset: 28 },
  });

  // 5. Entertainment
  const body5 = "Cannes — Directors at the Cannes Film Festival unveiled the independent films lineup, signaling departures from mainstream releases.";
  const art5 = await prisma.article.create({
    data: {
      headline: 'Cannes Film Festival Announces Groundbreaking Independent Stage Lineup',
      slug: 'cannes-film-festival-announces-independent-lineup',
      body: body5,
      category: Category.entertainment,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      stanceAxis: { left: 'Underwhelming', right: 'Lives up to the hype' },
      categoryImageId: imgEnt.id,
    },
  });
  await prisma.articleEntity.create({
    data: { articleId: art5.id, entityId: cannes.id, startOffset: 20, endOffset: 41 },
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
