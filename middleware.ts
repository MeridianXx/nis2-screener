import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { gcBuckets, takeToken } from '@/lib/rate-limit';

const buckets = new Map<string, { count: number; reset: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'anonymous';
  return req.headers.get('x-real-ip') ?? 'anonymous';
}

export function middleware(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  if (Math.random() < 0.01) gcBuckets(buckets, now);

  const result = takeToken(buckets, ip, now);
  if (!result.ok) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'RATE_LIMITED',
          message: 'Du har gjort för många uppslag. Vänta en stund och försök igen.',
        },
      },
      { status: 429, headers: { 'Retry-After': String(result.retryAfter) } },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/company/:path*'],
};
