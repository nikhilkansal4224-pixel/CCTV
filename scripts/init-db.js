#!/usr/bin/env node

/**
 * Database Initialization & Recreation Script for ARGUS Surreal CCTV
 * Target: MongoDB Atlas (Vercel-connected or local)
 */

require('../api/_env');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'cctv_surveillance';

if (!MONGO_URI) {
  console.error('❌ Error: MONGODB_URI is not set in environment or .env file');
  process.exit(1);
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USERNAME || 'admin',
  displayName: process.env.ADMIN_DISPLAY_NAME || 'Lead Security Sentinel',
  email: process.env.ADMIN_EMAIL || 'admin@argus-surveillance.net',
  role: 'admin',
  clearance: 'Level 4 Sentinel Clearance',
  pin: process.env.ADMIN_PIN || '7777',
  twoFactorEnabled: true,
  salt: process.env.AUTH_SALT || 'argus_default_salt_2026',
  createdAt: new Date()
};
DEFAULT_ADMIN.passwordHash = hashPassword(process.env.ADMIN_PASSWORD || 'password123', DEFAULT_ADMIN.salt);

async function initDatabase() {
  const isReset = process.argv.includes('--reset');

  const sanitizedUri = MONGO_URI.includes('@')
    ? MONGO_URI.replace(/:([^:@]+)@/, ':****@')
    : MONGO_URI;

  console.log('====================================================');
  console.log('🍃 ARGUS CCTV // MONGODB DATABASE RECREATION');
  console.log('====================================================');
  console.log(`Connecting to: ${sanitizedUri}`);
  console.log(`Database Name: ${DB_NAME}`);
  console.log(`Reset Mode:    ${isReset ? 'YES (Drop existing data)' : 'NO (Safe seed & index setup)'}\n`);

  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000
  });

  try {
    await client.connect();
    console.log('✓ Successfully connected to MongoDB Atlas cluster.\n');

    const db = client.db(DB_NAME);

    // List existing collections
    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

    if (isReset) {
      console.log('⚠️  Reset flag specified. Dropping existing collections...');
      for (const colName of ['users', 'sessions', 'events', 'cameras']) {
        if (existingCollections.includes(colName)) {
          await db.collection(colName).drop();
          console.log(`  - Dropped collection: ${colName}`);
        }
      }
      console.log('');
    }

    // 1. Ensure Collections
    console.log('⚙️  Ensuring collections and schema...');
    const collectionsToEnsure = ['users', 'sessions', 'events', 'cameras'];
    for (const name of collectionsToEnsure) {
      const exists = (await db.listCollections({ name }).toArray()).length > 0;
      if (!exists) {
        await db.createCollection(name);
        console.log(`  + Created collection: ${name}`);
      } else {
        console.log(`  ✓ Collection present: ${name}`);
      }
    }

    const users = db.collection('users');
    const sessions = db.collection('sessions');
    const events = db.collection('events');
    const cameras = db.collection('cameras');

    // 2. Setup Indexes
    console.log('\n🔍 Configuring database indexes...');
    
    // Users indexes
    await users.createIndex({ username: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { sparse: true });
    await users.createIndex({ googleId: 1 }, { sparse: true });
    console.log('  ✓ Users indexes created (username unique, email, googleId)');

    // Sessions indexes
    await sessions.createIndex({ token: 1 }, { unique: true });
    await sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
    console.log('  ✓ Sessions indexes created (token unique, TTL expiration 7 days)');

    // Events indexes
    await events.createIndex({ createdAt: -1 });
    await events.createIndex({ camLabel: 1 });
    await events.createIndex({ type: 1 });
    console.log('  ✓ Events indexes created (createdAt desc, camLabel, type)');

    // Cameras indexes
    await cameras.createIndex({ camId: 1 }, { unique: true });
    await cameras.createIndex({ lastSeen: -1 });
    console.log('  ✓ Cameras indexes created (camId unique, lastSeen desc)');

    // 3. Seed Default Admin User
    console.log('\n👤 Verifying administrator account...');
    const existingAdmin = await users.findOne({ username: DEFAULT_ADMIN.username });
    if (!existingAdmin) {
      await users.insertOne(DEFAULT_ADMIN);
      console.log(`  ✓ Created default admin operator: ${DEFAULT_ADMIN.username} (${DEFAULT_ADMIN.email})`);
      console.log(`    Default Password: password123`);
      console.log(`    Default PIN:      ${DEFAULT_ADMIN.pin}`);
    } else {
      console.log(`  ✓ Administrator already exists: ${existingAdmin.username} (${existingAdmin.email})`);
    }

    // 4. Verification Summary
    console.log('\n📊 Database Status & Collection Counts:');
    const counts = {
      users: await users.countDocuments(),
      sessions: await sessions.countDocuments(),
      events: await events.countDocuments(),
      cameras: await cameras.countDocuments()
    };

    for (const [col, cnt] of Object.entries(counts)) {
      console.log(`  • ${col.padEnd(10)}: ${cnt} documents`);
    }

    console.log('\n====================================================');
    console.log('🎉 ONLINE DATABASE SETUP COMPLETE & FULLY OPERATIONAL');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Database initialization error:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

initDatabase();
