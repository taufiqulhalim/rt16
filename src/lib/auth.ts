import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
}

function parseToken(token: string): TokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (!decoded.userId || !decoded.role || !decoded.exp) return null;
    if (decoded.exp < Date.now()) return null;
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyAuth(request: NextRequest): Promise<(AuthUser & { token: string }) | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;

  const payload = parseToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.active) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    token,
  };
}

export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<(AuthUser & { token: string }) | null> {
  const user = await verifyAuth(request);
  if (!user) return null;
  if (!roles.includes(user.role)) return null;
  return user;
}

export function createToken(userId: string, role: string): string {
  const payload: TokenPayload = {
    userId,
    role,
    exp: Date.now() + 86400000, // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
