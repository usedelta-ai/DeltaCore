import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

export interface UserSession {
  role: 'superadmin' | 'manager' | 'employee';
  companyId?: number;
  userId?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserSession;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Allow bypassing auth for login and public company routes
  const isPublicRoute = 
    request.routerPath === '/api/auth/login' || 
    request.url === '/api/auth/login' || 
    request.url.includes('/api/auth/login') ||
    request.routerPath === '/api/empresas/public/:base64Id' ||
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

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      reply.status(401).send({ error: 'Unauthorized: Token expired' });
      throw new Error('Unauthorized');
    }

    request.user = {
      role: payload.role,
      companyId: payload.companyId ? Number(payload.companyId) : undefined,
      userId: payload.userId ? Number(payload.userId) : undefined
    };
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized: Invalid token payload' });
    throw new Error('Unauthorized');
  }
}
