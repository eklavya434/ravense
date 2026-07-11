import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug, getStanceVotes, recordStanceVote, getUserStanceVote } from '@/lib/data';
import { getSessionId, setSessionIdCookie } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const votes = await getStanceVotes(article.id);
    const { id: sessionId } = await getSessionId();
    const userVote = await getUserStanceVote(article.id, sessionId);

    // Calculate distribution (10-point buckets: 0-9, 10-19, ..., 90-100)
    const buckets = Array(10).fill(0);
    votes.forEach(v => {
      const idx = Math.min(Math.floor(v / 10), 9);
      buckets[idx]++;
    });

    const average = votes.length > 0 ? votes.reduce((a, b) => a + b, 0) / votes.length : 50;

    return NextResponse.json({
      votesCount: votes.length,
      average,
      buckets,
      userVote
    });
  } catch (error) {
    console.error('Error in GET stance votes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const body = await request.json();
    const { value } = body;

    if (typeof value !== 'number' || value < 0 || value > 100) {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
    }

    const { id: sessionId, isNew } = await getSessionId();

    // Save the vote
    await recordStanceVote(article.id, value, sessionId);

    // Fetch updated votes
    const votes = await getStanceVotes(article.id);

    // Calculate distribution
    const buckets = Array(10).fill(0);
    votes.forEach(v => {
      const idx = Math.min(Math.floor(v / 10), 9);
      buckets[idx]++;
    });

    const average = votes.reduce((a, b) => a + b, 0) / votes.length;

    const response = NextResponse.json({
      success: true,
      votesCount: votes.length,
      average,
      buckets,
      userVote: value,
    });

    // Set cookie if session is new
    if (isNew) {
      // Set the session cookie on the response
      response.cookies.set('ravense_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Error in POST stance vote:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
