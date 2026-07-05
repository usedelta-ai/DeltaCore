import { FastifyRequest, FastifyReply } from 'fastify';

export interface UserSession {
  role: 'superadmin' | 'manager' | 'employee';
  companyId?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserSession;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const roleHeader = request.headers['x-user-role'] as string;
  const companyIdHeader = request.headers['x-user-company-id'] as string;

  // Default fallback if headers are not set (e.g. legacy or during transition)
  let role: 'superadmin' | 'manager' | 'employee' = 'superadmin';
  let companyId: number | undefined = undefined;

  if (roleHeader === 'manager' || roleHeader === 'employee') {
    role = roleHeader;
    if (companyIdHeader) {
      companyId = parseInt(companyIdHeader, 10);
    }
  } else if (roleHeader === 'superadmin') {
    role = 'superadmin';
  }

  request.user = {
    role,
    companyId: isNaN(companyId as number) ? undefined : companyId,
  };
}
