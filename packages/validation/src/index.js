import { z } from 'zod';
export const loginSchema=z.object({email:z.string().email(),password:z.string().min(8).max(128)});
export const userSchema=z.object({name:z.string().min(2).max(80),email:z.string().email(),role:z.enum(['ADMIN','MANAGER','VIEWER']).default('VIEWER')});
