import { NextRequest, NextResponse } from 'next/server';
import { 
  getArticleBySlug, 
  getStanceVotes, 
  recordStanceVote, 
  getUserStanceVote, 
  saveOpinion, 
  getApprovedOpinions 
} from '@/lib/data';
import { getSessionId } from '@/lib/session';
import { moderateOpinionText } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

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
    const opinions = await getApprovedOpinions(article.id);

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
      userVote,
      opinions: opinions.map((o: any) => ({
        ...o,
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      })),
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
    const { value, opinion } = body;

    if (typeof value !== 'number' || value < 0 || value > 100) {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
    }

    const { id: sessionId, isNew } = await getSessionId();

    // 1. Save the stance vote
    await recordStanceVote(article.id, value, sessionId);

    // 2. Save opinion if present
    let opinionStatus = 'none';
    let opinionError = null;

    if (opinion && typeof opinion === 'string') {
      const cleanOpinion = opinion.trim();
      if (cleanOpinion.length > 500) {
        opinionError = 'Opinion exceeds 500 characters limit.';
      } else if (cleanOpinion.length > 0) {
        try {
          const isApproved = await moderateOpinionText(cleanOpinion);
          const status = isApproved ? 'approved' : 'rejected';
          await saveOpinion(article.id, cleanOpinion, sessionId, status);
          opinionStatus = status;
        } catch (err: any) {
          opinionError = err.message || 'Failed to save opinion.';
        }
      }
    }

    // 3. Fetch updated votes & opinions
    const votes = await getStanceVotes(article.id);
    const approvedOpinions = await getApprovedOpinions(article.id);

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
      opinionStatus,
      opinionError,
      opinions: approvedOpinions.map((o: any) => ({
        ...o,
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      })),
    });

    // Set cookie if session is new
    if (isNew) {
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
    console.error('Error in POST stance vote & opinion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
