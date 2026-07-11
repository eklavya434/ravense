import { cookies } from 'next/headers';

/**
 * Retrieves the anonymous session ID from cookies.
 * If no session ID exists, it generates a new one.
 * Note: If generated fresh, it should be saved back to cookies in a mutation context (Server Action/API Route).
 */
export async function getSessionId(): Promise<{ id: string; isNew: boolean }> {
  const cookieStore = await cookies();
  const existingCookie = cookieStore.get('ravense_session_id');
  
  if (existingCookie?.value) {
    return { id: existingCookie.value, isNew: false };
  }
  
  // Generate a random UUID
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
  return { id: newId, isNew: true };
}

/**
 * Sets the session ID cookie.
 */
export async function setSessionIdCookie(id: string) {
  const cookieStore = await cookies();
  cookieStore.set('ravense_session_id', id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });
}
