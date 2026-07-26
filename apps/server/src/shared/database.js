import { PrismaClient } from '@prisma/client';
export const database=globalThis.__database??new PrismaClient();
if(process.env.NODE_ENV!=='production')globalThis.__database=database;
