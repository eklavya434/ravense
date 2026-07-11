'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, Send, RefreshCw, Rss, Info, CheckCircle } from 'lucide-react';
import { ingestArticle } from './actions';
import { CATEGORIES, RSS_FEEDS_CONFIG, CategoryKey } from '@/lib/categories';

export default function IngestPage() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Querying Gemini API...');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedRssCategory, setSelectedRssCategory] = useState<CategoryKey>('geopolitics');
  const [narratives, setNarratives] = useState<Array<{ id: string; title: string }>>([]);

  // Load existing narratives on mount
  useEffect(() => {
    const fetchNarratives = async () => {
      try {
        const res = await fetch('/api/narratives');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setNarratives(data);
          }
        }
      } catch (err) {
        console.error('Failed to load narrative threads:', err);
      }
    };
    fetchNarratives();
  }, [successMsg]); // Reload when an article is successfully ingested (which might have created a new thread)

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage('Extracting entities & mapping offsets via Gemini API...');
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      await ingestArticle(formData);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to ingest article. Please try again.');
      setLoading(false);
    }
  };

  const handleRssSync = async () => {
    setLoading(true);
    setLoadingMessage(`Syncing feeds and analyzing top articles for "${selectedRssCategory}"...`);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/ingest/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedRssCategory })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccessMsg(
          `Sync completed! Ingested ${data.ingestedCount} new articles. Skipped ${data.skippedCount} duplicates.`
        );
      } else {
        setError(data.error || 'Failed to sync RSS feeds.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error during RSS feed synchronization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-12 select-none">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/60 hover:text-wax transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
        </Link>
      </div>

      <header className="border-b border-ink/10 pb-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-wax" />
          <span className="font-mono text-xs uppercase tracking-widest text-ink/60">
            Ingestion & Intelligence Pipeline
          </span>
        </div>
        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-ink">
          Intel Control Panel
        </h1>
        <p className="font-serif italic text-sm text-ink/75 mt-2">
          Submit dispatches manually or pull live feeds to run the Gemini analysis, entity boundary mapping, and causal why-now chains.
        </p>
      </header>

      {/* Loading state overlay */}
      {loading && (
        <div className="fixed inset-0 bg-paper/95 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="w-16 h-16 border-4 border-wax/20 border-t-wax rounded-full animate-spin mb-6" />
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">
            Running Analysis
          </h2>
          <p className="font-mono text-xs uppercase tracking-wider text-wax animate-pulse mb-6">
            {loadingMessage}
          </p>
          <div className="max-w-md text-center space-y-2 text-ink/60 font-sans text-xs">
            <p>1. Fetching raw contents from source dispatches...</p>
            <p>2. Querying Gemini to extract load-bearing entities...</p>
            <p>3. Resolving Wikidata profiles and fetching Commons thumbnails...</p>
            <p>4. Synthesizing why-now causal chains and saving to database...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-certainty-speculation/10 border border-certainty-speculation/20 text-certainty-speculation p-4 rounded mb-6 text-sm">
          <strong>Error: </strong> {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-certainty-confirmed/10 border border-certainty-confirmed/20 text-certainty-confirmed p-4 rounded mb-6 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two Column Layout: Manual & Auto Ingest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Column 1 & 2: Manual Ingest Form */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-serif text-xl font-bold text-ink border-b border-ink/5 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-wax" /> Manual Dispatch Input
          </h2>

          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="headline" className="block font-mono text-xs uppercase tracking-wider text-ink/70">
                Headline
              </label>
              <input
                type="text"
                id="headline"
                name="headline"
                required
                placeholder="e.g. Economy Experiences Record-High Growth Amid Tech Influx"
                className="w-full px-4 py-2.5 border border-ink/20 rounded bg-paper/30 font-serif text-base text-ink focus:outline-none focus:border-wax focus:bg-paper"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="category" className="block font-mono text-xs uppercase tracking-wider text-ink/70">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full px-4 py-2.5 border border-ink/20 rounded bg-paper/30 font-mono text-xs uppercase tracking-wider text-ink focus:outline-none focus:border-wax focus:bg-paper"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="sourceUrl" className="block font-mono text-xs uppercase tracking-wider text-ink/70">
                  Source URL (Optional)
                </label>
                <input
                  type="url"
                  id="sourceUrl"
                  name="sourceUrl"
                  placeholder="https://example.com/original-article"
                  className="w-full px-4 py-2.5 border border-ink/20 rounded bg-paper/30 font-sans text-sm text-ink focus:outline-none focus:border-wax focus:bg-paper"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="body" className="block font-mono text-xs uppercase tracking-wider text-ink/70">
                Article Body
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={8}
                placeholder="Paste raw, unmodified article text here..."
                className="w-full px-4 py-2.5 border border-ink/20 rounded bg-paper/30 font-sans text-sm leading-relaxed text-ink focus:outline-none focus:border-wax focus:bg-paper"
              />
            </div>

            {/* Narrative Thread Options */}
            <div className="border border-ink/10 p-4 rounded bg-paper/20 space-y-4">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-wax font-bold mb-2">
                Narrative Thread Association
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="narrativeId" className="block font-mono text-[10px] uppercase tracking-wider text-ink/60">
                    Link to Existing Thread
                  </label>
                  <select
                    id="narrativeId"
                    name="narrativeId"
                    className="w-full px-3 py-2 border border-ink/10 rounded bg-paper/20 font-mono text-xs uppercase tracking-wider text-ink focus:outline-none focus:border-wax"
                  >
                    <option value="">-- None --</option>
                    {narratives.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="newNarrativeTitle" className="block font-mono text-[10px] uppercase tracking-wider text-ink/60">
                    Or Create New Thread
                  </label>
                  <input
                    type="text"
                    id="newNarrativeTitle"
                    name="newNarrativeTitle"
                    placeholder="e.g. Arctic Resource Conflict 2026"
                    className="w-full px-3 py-2 border border-ink/10 rounded bg-paper/20 font-sans text-xs text-ink focus:outline-none focus:border-wax"
                  />
                </div>
              </div>
            </div>

            <div className="border border-ink/10 p-4 rounded bg-paper/20 space-y-4">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-wax font-bold mb-2">
                Custom Stance Axis Labels (Overrides Defaults)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="leftStance" className="block font-mono text-[10px] uppercase tracking-wider text-ink/60">
                    Left Label (0%)
                  </label>
                  <input
                    type="text"
                    id="leftStance"
                    name="leftStance"
                    placeholder="Category default used if blank"
                    className="w-full px-3 py-2 border border-ink/10 rounded bg-paper/20 font-sans text-xs text-ink focus:outline-none focus:border-wax"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="rightStance" className="block font-mono text-[10px] uppercase tracking-wider text-ink/60">
                    Right Label (100%)
                  </label>
                  <input
                    type="text"
                    id="rightStance"
                    name="rightStance"
                    placeholder="Category default used if blank"
                    className="w-full px-3 py-2 border border-ink/10 rounded bg-paper/20 font-sans text-xs text-ink focus:outline-none focus:border-wax"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider bg-ink text-paper hover:bg-wax hover:text-paper font-semibold px-8 py-3 rounded transition-all duration-200 shadow-sm focus:outline-none cursor-pointer"
              >
                Submit to Manual Ingest &rarr;
              </button>
            </div>
          </form>
        </div>

        {/* Column 3: RSS Feeds Sync Panel */}
        <aside className="border border-ink/15 p-6 rounded-lg bg-paper/50 space-y-6">
          <h2 className="font-serif text-xl font-bold text-ink border-b border-ink/5 pb-2 flex items-center gap-2">
            <Rss className="w-4 h-4 text-wax" /> RSS Auto-Ingestion
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="rssCategory" className="block font-mono text-xs uppercase tracking-wider text-ink/70">
                Select Sync Section
              </label>
              <select
                id="rssCategory"
                value={selectedRssCategory}
                onChange={(e) => setSelectedRssCategory(e.target.value as CategoryKey)}
                className="w-full px-4 py-2 border border-ink/20 rounded bg-paper/30 font-mono text-xs uppercase tracking-wider text-ink focus:outline-none focus:border-wax"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Configured feeds display */}
            <div className="bg-ink/5 p-4 rounded border border-ink/5 space-y-2">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-ink/40">
                Configured RSS Feeds
              </span>
              <ul className="space-y-1.5 font-mono text-[10px] text-ink/70 break-all list-disc list-inside">
                {RSS_FEEDS_CONFIG[selectedRssCategory]?.map((feed, index) => (
                  <li key={index} className="truncate" title={feed}>
                    {feed.replace('https://', '')}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sync trigger button */}
            <button
              onClick={handleRssSync}
              className="w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider bg-ink text-paper hover:bg-wax hover:text-paper font-semibold py-3 rounded transition-all duration-200 shadow-sm focus:outline-none cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync Latest Articles
            </button>
          </div>

          <div className="border border-dashed border-ink/10 p-4 rounded text-ink/50 text-xs flex gap-2 items-start">
            <Info className="w-4 h-4 shrink-0 text-wax" />
            <p className="leading-normal font-sans">
              Syncing will pull the top 3 articles from each category RSS feed, run Gemini extraction, Wikidata entity imagery resolving, and save them automatically. Duplicate items are skipped.
            </p>
          </div>
        </aside>

      </div>
    </main>
  );
}
