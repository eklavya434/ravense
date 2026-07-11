'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, X, Shield, Activity, AlertCircle, HelpCircle
} from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  aliases: string[];
  oneLiner: string;
  certainty: string;
  whyNow: string[];
  stakeholders: any; // Array of { name, wants }
  imageUrl?: string | null;
  imageSource?: string | null;
}

interface Mention {
  id: string;
  startOffset: number;
  endOffset: number;
  entityId: string;
  entity: Entity;
}

interface Article {
  id: string;
  headline: string;
  slug: string;
  body: string;
  category: string;
  publishedAt: string | Date;
  sourceUrl: string | null;
  narrativeId: string | null;
  stanceAxis: any; // { left: string, right: string }
  categoryImageId?: string | null;
  categoryImage?: {
    id: string;
    category: string;
    imageUrl: string;
    photographerName: string;
    photographerUrl: string;
  } | null;
  narrative?: {
    id: string;
    title: string;
    articles: Array<{
      id: string;
      headline: string;
      slug: string;
      publishedAt: string | Date;
    }>;
  } | null;
  entities: Mention[];
}

interface ArticleReaderProps {
  article: Article;
  initialVotes: number[];
}

export default function ArticleReader({ article, initialVotes }: ArticleReaderProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [voteValue, setVoteValue] = useState<number>(50);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [votesData, setVotesData] = useState<{
    votesCount: number;
    average: number;
    buckets: number[];
  }>({
    votesCount: initialVotes.length,
    average: initialVotes.length > 0 ? initialVotes.reduce((a, b) => a + b, 0) / initialVotes.length : 50,
    buckets: calculateBuckets(initialVotes),
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load user vote from local storage if exists
  useEffect(() => {
    const savedVote = localStorage.getItem(`voted_${article.slug}`);
    if (savedVote !== null) {
      setHasVoted(true);
      setVoteValue(Number(savedVote));
    }
  }, [article.slug]);

  // Fetch latest votes on mount
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const res = await fetch(`/api/articles/${article.slug}/stance`);
        if (res.ok) {
          const data = await res.json();
          setVotesData({
            votesCount: data.votesCount,
            average: data.average,
            buckets: data.buckets,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stance votes:', err);
      }
    };
    fetchVotes();
  }, [article.slug]);

  function calculateBuckets(votes: number[]) {
    const buckets = Array(10).fill(0);
    votes.forEach(v => {
      const idx = Math.min(Math.floor(v / 10), 9);
      buckets[idx]++;
    });
    return buckets;
  }

  // Handle vote submit
  const handleVoteSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${article.slug}/stance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: voteValue }),
      });
      if (res.ok) {
        const data = await res.json();
        setVotesData({
          votesCount: data.votesCount,
          average: data.average,
          buckets: data.buckets,
        });
        setHasVoted(true);
        localStorage.setItem(`voted_${article.slug}`, String(voteValue));
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render body with clickable mentions
  const renderBody = () => {
    const sortedMentions = [...article.entities].sort((a, b) => a.startOffset - b.startOffset);
    const elements = [];
    let currentIndex = 0;

    for (let i = 0; i < sortedMentions.length; i++) {
      const mention = sortedMentions[i];

      if (mention.startOffset < currentIndex) {
        continue; // Skip overlap
      }

      if (mention.startOffset > currentIndex) {
        elements.push(
          <span key={`text-${currentIndex}`}>
            {article.body.substring(currentIndex, mention.startOffset)}
          </span>
        );
      }

      const mentionText = article.body.substring(mention.startOffset, mention.endOffset);
      const isSelected = selectedEntity?.id === mention.entity.id;

      elements.push(
        <button
          key={`mention-${mention.id}`}
          onClick={() => setSelectedEntity(mention.entity)}
          className={`font-serif font-medium border-b border-dashed cursor-pointer transition-all duration-150 rounded px-0.5 focus:outline-none ${
            isSelected 
              ? 'border-solid border-wax text-wax bg-wax/5 scale-102 font-semibold' 
              : 'border-wax/50 hover:border-wax hover:text-wax hover:bg-wax/5'
          }`}
          title={`Inspect context for: ${mention.entity.name}`}
        >
          {mentionText}
        </button>
      );

      currentIndex = mention.endOffset;
    }

    if (currentIndex < article.body.length) {
      elements.push(
        <span key={`text-end`}>
          {article.body.substring(currentIndex)}
        </span>
      );
    }

    return elements;
  };

  // Certainty styles mapper
  const getCertaintyStyle = (certainty: string) => {
    const c = certainty.toLowerCase();
    if (c.includes('confirm')) {
      return { bg: 'bg-certainty-confirmed/10', text: 'text-certainty-confirmed', border: 'border-certainty-confirmed/20', label: 'Confirmed', icon: Shield };
    }
    if (c.includes('official')) {
      return { bg: 'bg-certainty-official/10', text: 'text-certainty-official', border: 'border-certainty-official/20', label: 'Official Statement', icon: Activity };
    }
    if (c.includes('analyst') || c.includes('analysis') || c.includes('reading')) {
      return { bg: 'bg-certainty-analysis/10', text: 'text-certainty-analysis', border: 'border-certainty-analysis/20', label: 'Analyst Reading', icon: AlertCircle };
    }
    return { bg: 'bg-certainty-speculation/10', text: 'text-certainty-speculation', border: 'border-certainty-speculation/20', label: 'Speculation / Unconfirmed', icon: HelpCircle };
  };

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const maxBucketCount = Math.max(...votesData.buckets, 1);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12 select-none">
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/60 hover:text-wax transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dispatches
        </Link>
      </div>

      {/* Narrative Thread Strip */}
      {article.narrative && (
        <section className="mb-8 border border-ink/10 bg-paper/30 p-4 md:p-6 rounded-lg" aria-label="Narrative Thread">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-wax font-semibold bg-wax/5 px-2 py-0.5 rounded border border-wax/10">
              Narrative Thread
            </span>
            <h3 className="font-serif text-sm font-bold text-ink/80">{article.narrative.title}</h3>
          </div>
          <div className="relative flex flex-col md:flex-row gap-4 items-start md:items-center overflow-x-auto py-2">
            {article.narrative.articles.map((art, idx) => {
              const isActive = art.slug === article.slug;
              const dateObj = new Date(art.publishedAt);
              const formattedThreadDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
              
              return (
                <div key={art.id} className="flex items-center w-full md:w-auto">
                  <Link
                    href={`/article/${art.slug}`}
                    className={`text-left font-sans text-xs flex flex-col gap-1 transition-all ${
                      isActive 
                        ? 'text-ink font-bold pointer-events-none scale-102 border-l-2 md:border-l-0 md:border-t-2 border-wax pl-3 md:pl-0 md:pt-2' 
                        : 'text-ink/50 hover:text-ink hover:underline pl-3 md:pl-0 border-l border-ink/10 md:border-l-0 md:border-t md:border-ink/10 md:pt-2'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-ink/40 font-normal">
                      {idx + 1}. {formattedThreadDate}
                    </span>
                    <span className="line-clamp-1 max-w-xs md:max-w-[160px]">{art.headline}</span>
                  </Link>
                  {idx < article.narrative!.articles.length - 1 && (
                    <span className="hidden md:inline text-ink/20 mx-4 font-mono">&rarr;</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Grid: Article & Side Annotation panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Article content (cols 1 & 2) */}
        <article className="lg:col-span-2 space-y-6">
          {/* Category Header Image (Unsplash) */}
          {article.categoryImage && (
            <div className="w-full mb-6">
              <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden border border-ink/10 shadow-sm bg-paper/20">
                <img 
                  src={article.categoryImage.imageUrl} 
                  alt={`${article.category} banner`}
                  className="w-full h-full object-cover grayscale-10 contrast-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-paper/30 to-transparent" />
              </div>
              <div className="mt-2 text-right">
                <span className="font-mono text-[9px] text-ink/40 uppercase tracking-wider">
                  Photo via{' '}
                  <a 
                    href={article.categoryImage.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-wax transition-colors"
                  >
                    {article.categoryImage.photographerName}
                  </a>{' '}
                  on{' '}
                  <a 
                    href="https://unsplash.com/?utm_source=ravense&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-wax transition-colors"
                  >
                    Unsplash
                  </a>
                </span>
              </div>
            </div>
          )}

          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-mono text-xs uppercase tracking-wider text-wax font-medium bg-wax/5 px-2 py-0.5 rounded border border-wax/10">
                {article.category}
              </span>
              <time dateTime={new Date(article.publishedAt).toISOString()} className="font-mono text-xs text-ink/50">
                {formattedDate}
              </time>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-extrabold tracking-tight text-ink leading-tight">
              {article.headline}
            </h1>
            <div className="h-px bg-ink/10 w-full" />
          </header>

          {/* Reading body */}
          <section className="font-sans text-base md:text-lg text-ink/90 leading-relaxed space-y-6 antialiased pt-2">
            <p className="indent-8">{renderBody()}</p>
          </section>

          {article.sourceUrl && (
            <div className="pt-4">
              <a 
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-wax hover:underline"
              >
                Source: Original dispatch report &nearr;
              </a>
            </div>
          )}
        </article>

        {/* Side Panel (Annotation Panel) */}
        <aside className="lg:sticky lg:top-8 w-full">
          {selectedEntity ? (
            <div className="border border-ink/20 bg-paper p-6 rounded-lg shadow-lg relative flex flex-col gap-6 animate-fadeIn transition-all duration-300">
              {/* Close button */}
              <button 
                onClick={() => setSelectedEntity(null)}
                className="absolute top-4 right-4 p-1 hover:bg-ink/5 rounded-full transition-colors text-ink/60 hover:text-ink"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Image Flex */}
              <div className="flex gap-4 items-start justify-between pr-6">
                <div className="flex-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink/40 block mb-1">
                    Entity Profile
                  </span>
                  <h4 className="font-serif text-2xl font-bold text-ink leading-tight">
                    {selectedEntity.name}
                  </h4>
                  {selectedEntity.aliases.length > 0 && (
                    <span className="font-mono text-[10px] text-ink/50 block mt-1">
                      Aliases: {selectedEntity.aliases.join(', ')}
                    </span>
                  )}
                </div>
                {selectedEntity.imageUrl && selectedEntity.imageSource !== 'none' && (
                  <div className="w-16 h-16 rounded border border-ink/10 overflow-hidden shrink-0 shadow-sm bg-paper/20">
                    <img 
                      src={selectedEntity.imageUrl} 
                      alt={selectedEntity.name} 
                      className="w-full h-full object-cover grayscale-10 contrast-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Certainty Tag */}
              {(() => {
                const style = getCertaintyStyle(selectedEntity.certainty);
                const IconComponent = style.icon;
                return (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs font-mono w-fit ${style.bg} ${style.text} ${style.border}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{style.label}</span>
                  </div>
                );
              })()}

              {/* One Liner */}
              <div className="border-t border-ink/5 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50 block mb-1.5">
                  Definition
                </span>
                <p className="font-serif text-sm leading-relaxed text-ink/80 italic">
                  "{selectedEntity.oneLiner}"
                </p>
              </div>

              {/* Why Now Causal Chain */}
              <div className="border-t border-ink/5 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50 block mb-3">
                  Why Now / Causal Chain
                </span>
                <ol className="relative border-l border-ink/10 ml-2.5 space-y-4">
                  {selectedEntity.whyNow.map((bullet, idx) => (
                    <li key={idx} className="mb-4 ml-4">
                      <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-paper border border-ink/20 text-[9px] font-mono text-ink font-bold">
                        {idx + 1}
                      </span>
                      <p className="font-sans text-xs text-ink/85 leading-relaxed pt-0.5">{bullet}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Stakeholders Map */}
              <div className="border-t border-ink/5 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50 block mb-3">
                  Stakeholder Map
                </span>
                <div className="space-y-3">
                  {(selectedEntity.stakeholders as Array<{ name: string; wants: string }>).map((sh, idx) => (
                    <div key={idx} className="bg-ink/5 p-3 rounded border border-ink/5">
                      <span className="font-mono text-xs font-bold text-ink/80 block">{sh.name}</span>
                      <p className="font-sans text-xs text-ink/70 mt-1 leading-relaxed">{sh.wants}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-ink/20 bg-paper/40 p-8 rounded-lg text-center select-none py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center text-ink/40">
                <HelpCircle className="w-5 h-5" />
              </div>
              <p className="font-serif text-sm italic text-ink/50 leading-relaxed max-w-[200px]">
                Click on any underlined entities or terms in the dispatch report to view the intelligence panel.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Stance Slider & Opinion Section */}
      <section className="mt-20 border border-ink/10 p-6 md:p-8 bg-paper/50 rounded-lg max-w-3xl mx-auto" aria-label="Reader Stance Section">
        <header className="mb-6 text-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-wax font-bold block mb-1">
            Opinion Alignment
          </span>
          <h3 className="font-serif text-2xl font-bold text-ink">Register Your Stance</h3>
          <p className="font-sans text-xs text-ink/60 mt-1">
            Provide your calibration input to help maps structured reader assessments.
          </p>
        </header>

        {/* Stance Form */}
        <div className="space-y-8">
          <div>
            <input 
              type="range"
              min="0"
              max="100"
              value={voteValue}
              onChange={(e) => setVoteValue(Number(e.target.value))}
              disabled={hasVoted || isSubmitting}
              className="w-full h-1.5 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-wax focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between mt-3 font-mono text-xs uppercase tracking-wider text-ink/70">
              <span className="font-bold text-left max-w-[150px] leading-tight">
                &larr; {article.stanceAxis?.left || 'De-escalates'}
              </span>
              <span className="font-bold text-wax">{voteValue}%</span>
              <span className="font-bold text-right max-w-[150px] leading-tight">
                {article.stanceAxis?.right || 'Escalates'} &rarr;
              </span>
            </div>
          </div>

          {!hasVoted ? (
            <div className="flex justify-center">
              <button
                onClick={handleVoteSubmit}
                disabled={isSubmitting}
                className="font-mono text-xs uppercase tracking-wider bg-ink text-paper hover:bg-wax hover:text-paper font-semibold px-6 py-2.5 rounded transition-all duration-200 shadow-sm focus:outline-none"
              >
                {isSubmitting ? 'Recording...' : 'Submit Stance'}
              </button>
            </div>
          ) : (
            <div className="bg-ink/5 p-4 rounded text-center">
              <p className="font-mono text-xs text-wax font-semibold uppercase tracking-wider">
                Stance registered successfully
              </p>
              <p className="font-sans text-xs text-ink/50 mt-1">
                Your stance value: {voteValue}%
              </p>
            </div>
          )}
        </div>

        {/* Aggregated distribution visual curve/bar histogram */}
        <div className="mt-12 border-t border-ink/5 pt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h4 className="font-serif text-sm font-bold text-ink">Aggregate Distribution</h4>
              <p className="font-mono text-[10px] text-ink/50 uppercase tracking-widest mt-0.5">
                Based on {votesData.votesCount} reporting sessions
              </p>
            </div>
            <div className="font-mono text-xs">
              <span className="text-ink/60">Mean Consensus Stance: </span>
              <span className="font-bold text-wax">{votesData.average.toFixed(1)}%</span>
            </div>
          </div>

          {/* Histogram representation */}
          <div className="h-28 flex items-end gap-1.5 md:gap-2 px-2 border-b border-ink/20">
            {votesData.buckets.map((count, idx) => {
              const pct = (count / maxBucketCount) * 100;
              // Highlight the bucket the user's vote is in, if they voted
              const isUserBucket = hasVoted && Math.min(Math.floor(voteValue / 10), 9) === idx;

              return (
                <div 
                  key={idx} 
                  className="flex-1 flex flex-col justify-end h-full group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-ink text-paper font-mono text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10">
                    {count} votes ({idx * 10}-{(idx * 10) + 9}%)
                  </div>
                  {/* Histogram Bar */}
                  <div 
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      isUserBucket 
                        ? 'bg-wax border border-wax-dark/30 shadow-[0_0_8px_rgba(201,138,59,0.3)]' 
                        : 'bg-ink/20 group-hover:bg-ink/40'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 font-mono text-[9px] text-ink/40">
            <span>0%</span>
            <span>20%</span>
            <span>40%</span>
            <span>60%</span>
            <span>80%</span>
            <span>100%</span>
          </div>
        </div>
      </section>
    </div>
  );
}
