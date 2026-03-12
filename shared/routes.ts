import { z } from 'zod';
import { emailRequestSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  analyze: {
    get: {
      method: 'GET' as const,
      path: '/api/analyze' as const,
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        429: z.object({ message: z.string() }),
      }
    }
  },
  compare: {
    get: {
      method: 'GET' as const,
      path: '/api/compare' as const,
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        429: z.object({ message: z.string() }),
      }
    }
  },
  email: {
    send: {
      method: 'POST' as const,
      path: '/api/email' as const,
      input: emailRequestSchema,
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        400: errorSchemas.validation,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
