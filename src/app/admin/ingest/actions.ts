'use server';

import { redirect } from 'next/navigation';
import { saveArticle } from '@/lib/data';
import { extractEntities, generateEntityContext } from '@/lib/gemini';
import { Category } from '@prisma/client';

export async function ingestArticle(formData: FormData) {
  const headline = formData.get('headline') as string;
  const body = formData.get('body') as string;
  const category = formData.get('category') as string;
  const sourceUrl = (formData.get('sourceUrl') as string) || undefined;
  const sourceName = (formData.get('sourceName') as string) || undefined;
  const sourceCountry = (formData.get('sourceCountry') as string) || undefined;
  const leftStance = (formData.get('leftStance') as string) || undefined;
  const rightStance = (formData.get('rightStance') as string) || undefined;
  const narrativeId = (formData.get('narrativeId') as string) || undefined;
  const newNarrativeTitle = (formData.get('newNarrativeTitle') as string) || undefined;

  if (!headline || !body || !category) {
    throw new Error('Headline, body, and category are required.');
  }

  // Generate slug
  const slug = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  // 1. Run entity extraction via Gemini (or fallback)
  const extracted = await extractEntities(headline, body);

  // 2. Resolve entities and generate context for new ones
  const resolvedEntities = [];
  for (const ent of extracted) {
    // Generate context snippet around the first mention
    const firstMention = ent.mentions[0];
    const contextSnippet = body.substring(
      Math.max(0, firstMention.startOffset - 80),
      Math.min(body.length, firstMention.endOffset + 80)
    );

    // Generate context using Gemini (or fallback)
    const context = await generateEntityContext(ent.name, contextSnippet);

    resolvedEntities.push({
      name: ent.name,
      aliases: [],
      oneLiner: context.oneLiner,
      certainty: context.certainty,
      whyNow: context.whyNow,
      stakeholders: context.stakeholders,
      mentions: ent.mentions.map(m => ({
        startOffset: m.startOffset,
        endOffset: m.endOffset,
      })),
    });
  }

  // Determine stance labels
  const stanceAxis = (leftStance || rightStance) 
    ? { left: leftStance || 'De-escalates', right: rightStance || 'Escalates' }
    : undefined;

  // 3. Save article and entities using the data layer
  await saveArticle({
    headline,
    slug,
    body,
    category,
    sourceUrl,
    sourceName,
    sourceCountry,
    publishedAt: new Date(),
    stanceAxis: stanceAxis as any,
    narrativeId,
    newNarrativeTitle,
    entities: resolvedEntities,
  });

  // Redirect to the newly created article detail page
  redirect(`/article/${slug}`);
}
