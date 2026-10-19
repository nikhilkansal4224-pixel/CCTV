// SENTINEL // MongoDB Connection & Persistence Layer
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

let client = null;
let db = null;
let usersCollection = null;
let isConnected = false;

const MONGODB_URI = process.env.MONGODB_URI || null;
const DB_NAME = process.env.MONGODB_DB_NAME || 'sentinel_cctv';

// Connect to MongoDB if URI is provided
async function connectDB() {
  if (isConnected && db) {
    return { isConnected: true, db, usersCollection };
  }

  if (!MONGODB_URI) {
    // MongoDB URI not configured, using JSON file storage fallback
    return { isConnected: false, db: null, usersCollection: null };
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(DB_NAME);
    usersCollection = db.collection('users');

    // Create unique index on username
    await usersCollection.createIndex({ username: 1 }, { unique: true });

    isConnected = true;
    console.log(`[Database] Successfully connected to MongoDB database: "${DB_NAME}"`);

    // Sync any local users from data/users.json into MongoDB if not present
    await syncLocalUsersToMongo();

    return { isConnected: true, db, usersCollection };
  } catch (err) {
    console.warn(`[Database] MongoDB connection failed (${err.message}). Using local storage fallback.`);
    isConnected = false;
    client = null;
    db = null;
    usersCollection = null;
    return { isConnected: false, db: null, usersCollection: null };
  }
}

// Sync users from users.json into MongoDB upon initial connection
async function syncLocalUsersToMongo() {
  if (!usersCollection || !fs.existsSync(USERS_FILE)) return;
  try {
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    const localUsers = JSON.parse(content);
    if (Array.isArray(localUsers)) {
      for (const u of localUsers) {
        await usersCollection.updateOne(
          { username: u.username },
          { $setOnInsert: u },
          { upsert: true }
        );
      }
    }
  } catch (e) {
    console.warn('[Database] Sync local users to Mongo notice:', e.message);
  }
}

let memoryUsers = [];

// User Model Operations
async function findUserByUsername(username) {
  const cleanUsername = (username || '').trim().toLowerCase();
  if (!cleanUsername) return null;

  if (isConnected && usersCollection) {
    try {
      const user = await usersCollection.findOne({
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') },
      });
      return user;
    } catch (e) {
      console.warn('[Database] Mongo findUser error, checking local fallback:', e.message);
    }
  }

  // Local file fallback
  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(content);
      const found = users.find(u => u.username.toLowerCase() === cleanUsername);
      if (found) return found;
    } catch (e) {}
  }

  return memoryUsers.find(u => u.username.toLowerCase() === cleanUsername) || null;
}

async function insertUser(newUser) {
  if (isConnected && usersCollection) {
    try {
      await usersCollection.insertOne(newUser);
      // Also update local file cache
      updateLocalFile(newUser);
      return newUser;
    } catch (e) {
      console.warn('[Database] Mongo insertUser error, using local fallback:', e.message);
    }
  }

  // Local file fallback
  updateLocalFile(newUser);
  return newUser;
}

async function getAllUsers() {
  if (isConnected && usersCollection) {
    try {
      const users = await usersCollection.find({}).toArray();
      return users;
    } catch (e) {
      // Fallback
    }
  }

  let list = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      list = JSON.parse(content) || [];
    } catch (e) {}
  }
  for (const mu of memoryUsers) {
    if (!list.some(u => u.username.toLowerCase() === mu.username.toLowerCase())) {
      list.push(mu);
    }
  }
  return list;
}

function updateLocalFile(newUser) {
  const mIdx = memoryUsers.findIndex(u => u.username.toLowerCase() === newUser.username.toLowerCase());
  if (mIdx >= 0) {
    memoryUsers[mIdx] = newUser;
  } else {
    memoryUsers.push(newUser);
  }

  try {
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
    const idx = users.findIndex(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (idx >= 0) {
      users[idx] = newUser;
    } else {
      users.push(newUser);
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {}
}

function getStatus() {
  return {
    success: true,
    mode: isConnected ? 'mongodb' : 'local_fallback',
    database: isConnected ? 'mongodb' : 'file_fallback',
    connected: isConnected,
    dbName: isConnected ? DB_NAME : 'local_json',
  };
}

module.exports = {
  connectDB,
  findUserByUsername,
  insertUser,
  getAllUsers,
  getStatus,
};
