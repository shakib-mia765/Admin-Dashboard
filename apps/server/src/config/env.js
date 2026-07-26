import { z } from 'zod';
const schema=z.object({NODE_ENV:z.enum(['development','test','production']).default('development'),PORT:z.coerce.number().default(4000),DATABASE_URL:z.string().min(1),JWT_SECRET:z.string().min(32),WEB_ORIGIN:z.string().url().default('http://localhost:5173')});
export const env=schema.parse(process.env);
