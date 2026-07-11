import { notFound } from 'next/navigation';
import { getArticleBySlug, getStanceVotes, getApprovedOpinions } from '@/lib/data';
import ArticleReader from '@/components/ArticleReader';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Set dynamic runtime so it doesn't try to statically build pages without db access in CI/CD.
export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Fetch initial votes and opinions for server render
  const votes = await getStanceVotes(article.id);
  const opinions = await getApprovedOpinions(article.id);

  // Serialize the date fields and types for the client component
  const serializedArticle = {
    ...article,
    publishedAt: article.publishedAt instanceof Date ? article.publishedAt.toISOString() : article.publishedAt,
    createdAt: article.createdAt instanceof Date ? article.createdAt.toISOString() : article.createdAt,
    categoryImage: article.categoryImage
      ? {
          ...article.categoryImage,
          fetchedAt: article.categoryImage.fetchedAt instanceof Date 
            ? article.categoryImage.fetchedAt.toISOString() 
            : article.categoryImage.fetchedAt,
        }
      : null,
    entities: article.entities.map((mention: any) => ({
      ...mention,
      entity: {
        ...mention.entity,
        imageFetchedAt: mention.entity.imageFetchedAt instanceof Date 
          ? mention.entity.imageFetchedAt.toISOString() 
          : mention.entity.imageFetchedAt,
      }
    })),
    narrative: article.narrative
      ? {
          ...article.narrative,
          articles: article.narrative.articles.map((art: any) => ({
            ...art,
            publishedAt: art.publishedAt instanceof Date ? art.publishedAt.toISOString() : art.publishedAt,
          })),
        }
      : null,
  };

  const serializedOpinions = opinions.map((o: any) => ({
    ...o,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
  }));

  return (
    <ArticleReader 
      article={serializedArticle as any} 
      initialVotes={votes} 
      initialOpinions={serializedOpinions} 
    />
  );
}
