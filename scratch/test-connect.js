const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const { PrismaClient } = require('@prisma/client');

async function test(url) {
  console.log('Testing with URL:', url ? url.replace(/:[^:]*@/, ':***@') : 'from env');
  const prisma = new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
  const start = Date.now();
  try {
    await prisma.$connect();
    console.log('✅ Connected in', Date.now() - start, 'ms');
    const count = await prisma.user.count();
    console.log('User count:', count);
  } catch (err) {
    console.error('❌ Failed in', Date.now() - start, 'ms:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  // Test 1: current DATABASE_URL
  console.log('--- Test 1: Current DATABASE_URL ---');
  await test();

  // Test 2: with connect_timeout=30
  console.log('\n--- Test 2: With connect_timeout=30 ---');
  const base = process.env.DATABASE_URL;
  const urlWithTimeout = base.includes('?') ? `${base}&connect_timeout=30` : `${base}?connect_timeout=30`;
  await test(urlWithTimeout);

  // Test 3: Transaction pooler port 6543 with pgbouncer=true
  console.log('\n--- Test 3: Transaction Pooler (Port 6543) ---');
  const txUrl = base.replace(':5432/', ':6543/') + '?pgbouncer=true&connect_timeout=30';
  await test(txUrl);
}

run().finally(() => process.exit(0));

