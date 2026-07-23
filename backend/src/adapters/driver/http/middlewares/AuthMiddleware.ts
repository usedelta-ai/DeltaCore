import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { db } from '../../../../db';
import { userSessions } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export interface UserSession {
  role: 'superadmin' | 'manager' | 'employee';
  companyId?: number;
  userId?: number;
  sessionId?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserSession;
  }
}

const ALLOWED_SESSION_ROUTES = [
  '/api/auth/change-password',
  '/api/auth/logout',
  '/api/auth/me',
];

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const isPublicRoute =
    request.url === '/api/auth/login' ||
    request.url.includes('/api/auth/login') ||
    request.url.includes('/api/empresas/public/');

  if (isPublicRoute) {
    return;
  }

  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized: Missing or invalid token format' });
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const passKey = process.env.PASS_KEY;
  if (!passKey) {
    reply.status(500).send({ error: 'Server error: PASS_KEY is not defined' });
    throw new Error('PASS_KEY undefined');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    reply.status(401).send({ error: 'Unauthorized: Invalid token structure' });
    throw new Error('Unauthorized');
  }

  const [header, data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', passKey).update(`${header}.${data}`).digest('base64url');
  if (signature !== expectedSig) {
    reply.status(401).send({ error: 'Unauthorized: Invalid token signature' });
    throw new Error('Unauthorized');
  }

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      reply.status(401).send({ error: 'Unauthorized: Token expired' });
      throw new Error('Unauthorized');
    }
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized: Invalid token payload' });
    throw new Error('Unauthorized');
  }

  const sessionToken = payload.sessionId;
  const userId = payload.userId ? Number(payload.userId) : undefined;

  if (sessionToken && userId) {
    const isSessionRoute = ALLOWED_SESSION_ROUTES.some(
      route => request.url === route || request.url.startsWith(route)
    );

    const [session] = await db.select()
      .from(userSessions)
      .where(eq(userSessions.token, sessionToken));

    if (!session || session.is_revoked) {
      reply.status(401).send({ error: 'Sessão revogada ou inexistente', code: 'SESSION_REVOKED' });
      throw new Error('Unauthorized');
    }

    if (session.expires_at && new Date() > new Date(session.expires_at)) {
      reply.status(401).send({ error: 'Sessão expirada', code: 'SESSION_EXPIRED' });
      throw new Error('Unauthorized');
    }

    if (!isSessionRoute) {
      await db.update(userSessions)
        .set({ last_activity_at: new Date() })
        .where(eq(userSessions.id, session.id));
    }
  }

  request.user = {
    role: payload.role,
    companyId: payload.companyId ? Number(payload.companyId) : undefined,
    userId: payload.userId ? Number(payload.userId) : undefined,
    sessionId: payload.sessionId,
  };
}
