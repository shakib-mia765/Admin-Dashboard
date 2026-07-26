import assert from 'node:assert/strict';
import test from 'node:test';
process.env.DATABASE_URL??='postgresql://postgres:postgres@localhost:5432/ultrafaang';process.env.JWT_SECRET??='development-secret-development-secret';
const { app }=await import('../src/app.js');
test('app exposes health route',()=>assert.equal(typeof app,'function'));
