import Link from 'next/link';
import { getArticles, getNarrativeThreads } from '@/lib/data';
import CategoryNav from '@/components/CategoryNav';
import { BookOpen, FolderOpen, Calendar, Activity } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ category?: string; narrative?: string }>;
}

export const dynamic = 'force-dynamic';

function getRelativeTimeString(date: Date | string) {
  const now = new Date();
  const published = new Date(date);
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return 'just in';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams.category || 'all';
  const activeNarrativeId = resolvedParams.narrative || null;

  const allArticles = await getArticles();
  const narratives = await getNarrativeThreads();

  // Determine active narrative thread object
  const activeNarrative = activeNarrativeId 
    ? narratives.find(n => n.id === activeNarrativeId) 
    : null;

  // Filter articles based on active parameters
  let filteredArticles = allArticles;
  if (activeNarrativeId) {
    filteredArticles = allArticles.filter(a => a.narrativeId === activeNarrativeId);
  } else if (activeCategory !== 'all') {
    filteredArticles = allArticles.filter(a => a.category === activeCategory);
  }

  // Filter "Just In" articles (published in the last 4 hours)
  const now = new Date();
  const justInArticles = allArticles.filter(art => {
    const diffMs = now.getTime() - new Date(art.publishedAt).getTime();
    return diffMs >= 0 && diffMs < 4 * 60 * 60 * 1000;
  });

  return (
    <>
      {/* Sticky Header Nav */}
      <CategoryNav activeCategory={activeNarrativeId ? 'none' : activeCategory} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pb-12 select-none">
        
        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mt-4">
          
          {/* Main Feed (Left 3 Columns) */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Header Section */}
            <header className="border-b border-ink/10 pb-8 mb-6 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-6">
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

            {/* "Just In" Strip */}
            {justInArticles.length > 0 && (
              <section className="bg-wax/5 border border-wax/20 p-4 rounded-lg flex flex-col gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-wax animate-ping" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-wax font-bold">
                    Just In
                  </span>
                </div>
                <div className="flex flex-col md:flex-row gap-4 overflow-x-auto py-1 no-scrollbar">
                  {justInArticles.map(art => {
                    const relativeTime = getRelativeTimeString(art.publishedAt);
                    return (
                      <Link 
                        key={art.id} 
                        href={`/article/${art.slug}`}
                        className="text-left font-serif text-xs flex flex-col gap-1 p-3 bg-paper border border-ink/5 hover:border-wax hover:bg-paper/85 rounded transition-all shrink-0 w-full md:w-60 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[9px] text-wax uppercase tracking-wider font-semibold">{art.category}</span>
                          <span className="font-mono text-[9px] text-ink/40 font-bold">{relativeTime}</span>
                        </div>
                        <span className="line-clamp-2 text-ink font-bold leading-tight mt-1">{art.headline}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Timeline Filter Active Banner */}
            {activeNarrative && (
              <div className="bg-wax/5 border border-wax/20 p-5 rounded-lg flex items-center justify-between gap-4 animate-fadeIn">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-wax font-bold block mb-1">
                    Active Timeline Filter
                  </span>
                  <h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-wax shrink-0" /> {activeNarrative.title}
                  </h2>
                </div>
                <Link 
                  href="/"
                  className="font-mono text-xs uppercase tracking-wider text-ink/50 hover:text-ink hover:underline shrink-0"
                >
                  Clear Filter [x]
                </Link>
              </div>
            )}

            {/* Articles Feed */}
            <section className="space-y-10">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-ink/20 rounded-lg">
                  <p className="font-serif italic text-ink/60">No dispatches found.</p>
                </div>
              ) : (
                filteredArticles.map(article => {
                  const dateStr = new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  const relativeTimeStr = getRelativeTimeString(article.publishedAt);

                  return (
                    <article 
                      key={article.id} 
                      className="border border-ink/10 p-6 md:p-8 hover:border-wax/50 bg-paper/50 hover:bg-paper rounded-lg transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                    >
                      {/* Top Metadata */}
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs uppercase tracking-wider text-wax font-medium bg-wax/5 px-2 py-0.5 rounded border border-wax/10">
                            {article.category}
                          </span>
                          {article.sourceName && (
                            <span className="font-mono text-xs text-ink/50 bg-ink/5 px-2 py-0.5 rounded border border-ink/10">
                              {article.sourceName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs text-ink/50">
                          <time dateTime={new Date(article.publishedAt).toISOString()}>
                            {dateStr}
                          </time>
                          <span>&bull;</span>
                          <span className="text-wax font-bold">{relativeTimeStr}</span>
                        </div>
                      </div>

                      {/* Headline */}
                      <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink hover:text-wax transition-colors duration-200">
                        <Link href={`/article/${article.slug}`} className="focus:outline-none">
                          {article.headline}
                        </Link>
                      </h2>

                      {/* Teaser (Generated 60-word summary) */}
                      <p className="mt-4 font-sans text-sm md:text-base text-ink/75 leading-relaxed">
                        {article.summary || article.body}
                      </p>

                      {/* Footer Actions */}
                      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-ink/5 pt-4">
                        <Link 
                          href={`/article/${article.slug}`}
                          className="font-mono text-xs uppercase tracking-wider text-wax font-bold hover:underline"
                        >
                          Analyze Dispatch &rarr;
                        </Link>
                        {article.sourceUrl && article.sourceLinkVerified && (
                          <a 
                            href={article.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs uppercase tracking-wider text-ink/40 hover:text-ink hover:underline"
                          >
                            Original Source &nearr;
                          </a>
                        )}
                        {article.narrative && (
                          <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-ink/40 border border-ink/10 px-2 py-0.5 rounded">
                            Part of: {article.narrative.title}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </div>

          {/* Sidebar Narrative Timelines (Right 1 Column) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-20 space-y-6 pt-4">
            <div className="border border-ink/15 p-6 rounded-lg bg-paper/50 space-y-6 shadow-sm">
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink/40 border-b border-ink/5 pb-3 flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-wax" /> Narrative Timelines
              </h2>

              {narratives.length === 0 ? (
                <p className="font-serif italic text-xs text-ink/40">No active timelines.</p>
              ) : (
                <div className="space-y-4">
                  {narratives.map(narrativeItem => {
                    const isSelected = activeNarrativeId === narrativeItem.id;
                    const count = narrativeItem.articles?.length || 0;

                    return (
                      <Link 
                        key={narrativeItem.id}
                        href={`/?narrative=${narrativeItem.id}`}
                        className={`block text-left p-3.5 rounded border transition-all duration-200 ${
                          isSelected 
                            ? 'bg-ink text-paper border-ink scale-102 font-bold shadow-[0_4px_12px_rgba(0,0,0,0.08)]' 
                            : 'bg-paper border-ink/10 hover:border-wax hover:bg-paper/85'
                        }`}
                      >
                        <h3 className={`font-serif text-xs font-bold leading-tight ${isSelected ? 'text-paper' : 'text-ink/85'}`}>
                          {narrativeItem.title}
                        </h3>
                        <span className={`font-mono text-[9px] uppercase tracking-wider mt-2 block ${isSelected ? 'text-paper/60' : 'text-ink/40'}`}>
                          {count} updates in thread
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {activeNarrativeId && (
                <div className="pt-2 text-center">
                  <Link 
                    href="/"
                    className="font-mono text-[10px] uppercase tracking-widest text-wax hover:underline"
                  >
                    Clear timeline filter &times;
                  </Link>
                </div>
              )}
            </div>
            
            {/* Context Widget info */}
            <div className="border border-dashed border-ink/10 p-5 rounded-lg text-ink/40 text-[11px] leading-relaxed font-sans flex gap-2 items-start">
              <Calendar className="w-4 h-4 shrink-0 text-wax/60" />
              <p>
                Narrative Timelines bundle related stories chronologically. Clicking on a timeline isolates the thread to let you trace the sequence of events over time.
              </p>
            </div>
          </aside>

        </div>

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
