import { NextResponse } from 'next/server';
import { getNarrativeThreads } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const threads = await getNarrativeThreads();
    return NextResponse.json(threads);
  } catch (error) {
    console.error('Error fetching narratives:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
