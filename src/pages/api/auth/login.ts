/**
 * POST /api/auth/login
 * User login endpoint
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/src/services/auth/auth.service';
import { checkRateLimit, getRateLimitHeaders } from '@/src/middleware/auth.middleware';

interface LoginResponse {
  user_id?: string;
  access_token?: string;
  refresh_token?: string;
  token_type?: 'Bearer';
  expires_in?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get client IP for rate limiting
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                   req.socket.remoteAddress ||
                   'unknown';

  // Check rate limit (10 requests/minute per IP)
  const rateLimitCheck = checkRateLimit(`login:${clientIp}`);
  const rateLimitHeaders = getRateLimitHeaders(`login:${clientIp}`);

  // Add rate limit headers
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rateLimitCheck.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Call auth service
    const result = await AuthService.login({ email, password });

    if (!result.success) {
      // Return 401 Unauthorized for invalid credentials
      return res.status(401).json({ error: result.error });
    }

    // Return 200 OK on success
    return res.status(200).json(result.response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Login error:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
