'use client';

import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import ThemeToggle from './ThemeToggle';
import PushSettings from './PushSettings';

interface CategoryNavProps {
  activeCategory?: string;
}

export default function CategoryNav({ activeCategory = 'all' }: CategoryNavProps) {
  return (
    <nav 
      className="sticky top-0 z-40 w-full bg-paper/95 backdrop-blur-md border-b border-ink/10 py-3.5 px-4 mb-8 select-none"
      aria-label="Primary Category Navigation"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
        {/* Brand Logo Link */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-6.5 h-6.5 rounded-full bg-wax flex items-center justify-center text-paper font-serif font-bold text-xs shadow-sm border border-wax-dark/10">
            R
          </div>
          <span className="font-serif font-bold text-sm tracking-tight text-ink group-hover:text-wax transition-colors">
            Ravense
          </span>
        </Link>

        {/* Scrollable Category items */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 justify-center">
          {/* "All" Item */}
          <Link
            href="/"
            className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
              activeCategory === 'all'
                ? 'bg-ink text-paper font-bold'
                : 'text-ink/60 hover:text-ink hover:bg-ink/5'
            }`}
          >
            All
          </Link>

          {/* Dots & Categories */}
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key;
            return (
              <React.Fragment key={cat.key}>
                <span className="text-ink/20 font-mono text-[10px] select-none">&bull;</span>
                <Link
                  href={`/?category=${cat.key}`}
                  className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-ink text-paper font-bold'
                      : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                  }`}
                >
                  {cat.label}
                </Link>
              </React.Fragment>
            );
          })}
        </div>

        {/* Theme and Push Settings */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <PushSettings />
        </div>
      </div>
    </nav>
  );
}

