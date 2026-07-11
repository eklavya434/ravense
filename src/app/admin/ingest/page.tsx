'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, Send, CheckCircle } from 'lucide-react';
import { ingestArticle } from './actions';

export default function IngestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      await ingestArticle(formData);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to ingest article. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12 md:py-20 select-none">
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
            Ingestion Pipeline
          </span>
        </div>
        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-ink">
          Ingest Intel Report
        </h1>
        <p className="font-serif italic text-sm text-ink/75 mt-2">
          Submit raw news articles. Our background system will query Gemini to extract load-bearing entities, map offsets, and compile causal chains.
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
            Querying Gemini API...
          </p>
          <div className="max-w-md text-center space-y-2 text-ink/60 font-sans text-xs">
            <p>1. Analyzing raw text for load-bearing geopolitical entities...</p>
            <p>2. Computing character boundary offsets in original body...</p>
            <p>3. Resolving entities and compiling why-now causal chains...</p>
            <p>4. Synthesizing stakeholder maps and saving to database...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-certainty-speculation/10 border border-certainty-speculation/20 text-certainty-speculation p-4 rounded mb-6 text-sm">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Ingestion Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="headline" className="block font-mono text-xs uppercase tracking-wider text-ink/70">
            Headline
          </label>
          <input
            type="text"
            id="headline"
            name="headline"
            required
            placeholder="e.g. NATO Ministers Convene in Antalya to Address Mediterranean Security"
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
              <option value="geopolitics">Geopolitics</option>
              <option value="domestic-politics">Domestic Politics</option>
              <option value="macroeconomics">Macroeconomics</option>
              <option value="security">Security</option>
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
            rows={10}
            placeholder="Paste raw, unmodified article text here..."
            className="w-full px-4 py-2.5 border border-ink/20 rounded bg-paper/30 font-sans text-sm leading-relaxed text-ink focus:outline-none focus:border-wax focus:bg-paper"
          />
        </div>

        <div className="border border-ink/10 p-4 rounded bg-paper/20 space-y-4">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-wax font-bold mb-2">
            Opinion Axis Setup
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
                defaultValue="De-escalates"
                placeholder="e.g. De-escalates"
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
                defaultValue="Escalates"
                placeholder="e.g. Escalates"
                className="w-full px-3 py-2 border border-ink/10 rounded bg-paper/20 font-sans text-xs text-ink focus:outline-none focus:border-wax"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider bg-ink text-paper hover:bg-wax hover:text-paper font-semibold px-8 py-3 rounded transition-all duration-200 shadow-sm focus:outline-none cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Submit to Pipeline
          </button>
        </div>
      </form>
    </main>
  );
}
