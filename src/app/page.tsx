import Link from 'next/link';
import { getArticles } from '@/lib/data';
import CategoryNav from '@/components/CategoryNav';

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams.category || 'all';

  const allArticles = await getArticles();

  const filteredArticles = activeCategory === 'all' 
    ? allArticles 
    : allArticles.filter(a => a.category === activeCategory);

  return (
    <>
      {/* Sticky Header Nav */}
      <CategoryNav activeCategory={activeCategory} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-12 select-none">
        {/* Header Section */}
        <header className="border-b border-ink/10 pb-8 mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
                Internal Dispatch
              </span>
            </div>
            <h1 className="font-serif text-5xl font-extrabold tracking-tight text-ink md:text-6xl">
              Ravense
            </h1>
            <p className="mt-3 font-serif italic text-lg text-ink/75 max-w-xl">
              Raw intelligence reports, mapped with load-bearing entities, causal why-now chains, and collective opinion metrics.
            </p>
          </div>

          {/* Admin Link */}
          <div className="flex justify-center">
            <Link 
              href="/admin/ingest" 
              className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 border border-ink/20 hover:border-wax hover:text-wax rounded transition-colors"
            >
              Ingest Panel
            </Link>
          </div>
        </header>

        {/* Articles Feed */}
        <section className="space-y-12">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-ink/20 rounded-lg">
              <p className="font-serif italic text-ink/60">No dispatches found in this category.</p>
            </div>
          ) : (
            filteredArticles.map(article => {
              const dateStr = new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              const snippet = article.body.length > 150 
                ? article.body.substring(0, 150) + '...'
                : article.body;

              return (
                <article 
                  key={article.id} 
                  className="group relative border border-ink/10 p-6 md:p-8 hover:border-wax/50 bg-paper/50 hover:bg-paper rounded-lg transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                >
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="font-mono text-xs uppercase tracking-wider text-wax font-medium bg-wax/5 px-2 py-0.5 rounded border border-wax/10">
                      {article.category}
                    </span>
                    <time 
                      dateTime={new Date(article.publishedAt).toISOString()}
                      className="font-mono text-xs text-ink/50"
                    >
                      {dateStr}
                    </time>
                  </div>

                  {/* Headline */}
                  <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink group-hover:text-wax transition-colors duration-200">
                    <Link href={`/article/${article.slug}`} className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {article.headline}
                    </Link>
                  </h2>

                  {/* Teaser */}
                  <p className="mt-4 font-sans text-sm md:text-base text-ink/75 leading-relaxed">
                    {snippet}
                  </p>

                  {/* Footer read link */}
                  <div className="mt-6 flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-ink/80 group-hover:text-wax group-hover:translate-x-1 transition-all duration-200">
                      Read Intel Report &rarr;
                    </span>
                    {article.narrative && (
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-ink/40 border border-ink/10 px-2 py-0.5 rounded">
                        Part of: {article.narrative.title}
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-ink/10 pt-8 text-center">
          <p className="font-mono text-[10px] text-ink/40 uppercase tracking-widest">
            Ravense Network &bull; Confidentiality Assured
          </p>
        </footer>
      </main>
    </>
  );
}
