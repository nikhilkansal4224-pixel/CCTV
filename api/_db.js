const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'cctv_surveillance';

let cachedClient = null;
let cachedDb = null;

// In-memory fallback if MongoDB cloud is not configured on Vercel
let memoryEvents = [];
let memoryCameras = new Map();

async function connectToDatabase() {
  if (cachedDb) {
    return {
      client: cachedClient,
      db: cachedDb,
      events: cachedDb.collection('events'),
      cameras: cachedDb.collection('cameras'),
      isMemory: false,
      uri: MONGO_URI,
      dbName: DB_NAME
    };
  }

  // If no remote MongoDB URI is configured on Vercel, use graceful in-memory fallback
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI && process.env.VERCEL) {
    return {
      client: null,
      db: null,
      events: {
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: async () => [...memoryEvents].reverse().slice(0, 50)
            })
          })
        }),
        insertOne: async (doc) => {
          doc._id = 'mem_' + Date.now() + Math.random().toString(36).substring(2, 6);
          memoryEvents.push(doc);
          if (memoryEvents.length > 50) memoryEvents.shift();
          return { insertedId: doc._id };
        },
        deleteMany: async () => {
          memoryEvents = [];
          return { deletedCount: memoryEvents.length };
        },
        countDocuments: async () => memoryEvents.length
      },
      cameras: {
        updateOne: async (query, update) => {
          memoryCameras.set(query.camId, update.$set);
          return { upsertedId: query.camId };
        }
      },
      isMemory: true,
      uri: 'Vercel Serverless Memory (Set MONGODB_URI for Atlas)',
      dbName: 'memory_store'
    };
  }

  try {
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });
    await client.connect();
    const database = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = database;

    return {
      client,
      db: database,
      events: database.collection('events'),
      cameras: database.collection('cameras'),
      isMemory: false,
      uri: MONGO_URI,
      dbName: DB_NAME
    };
  } catch (err) {
    console.warn('MongoDB connection failed, using fallback:', err.message);
    return {
      client: null,
      db: null,
      events: {
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: async () => [...memoryEvents].reverse().slice(0, 50)
            })
          })
        }),
        insertOne: async (doc) => {
          doc._id = 'mem_' + Date.now();
          memoryEvents.push(doc);
          return { insertedId: doc._id };
        },
        deleteMany: async () => { memoryEvents = []; },
        countDocuments: async () => memoryEvents.length
      },
      cameras: {
        updateOne: async () => {}
      },
      isMemory: true,
      uri: 'Offline Fallback',
      dbName: 'fallback'
    };
  }
}

module.exports = { connectToDatabase };
