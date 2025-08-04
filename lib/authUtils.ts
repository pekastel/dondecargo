import { NextRequest } from 'next/server';
import { auth } from './auth';

/**
 * Extracts the authenticated user id from the Better-Auth session.
 * Throws a 401 Response if the request is unauthenticated.
 */
export async function getUserIdOrThrow(req: NextRequest): Promise<string> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session.user.id as string;
}
