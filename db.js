// SENTINEL // Supabase Connection & Persistence Layer
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ysqgsegtbczubssaumgq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzcWdzZWd0YmN6dWJzc2F1bWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzU0NDYsImV4cCI6MjEwODE1MTQ0Nn0.tpDHSwqPru2HpFHRFsBNx-uwZACFUDNJw7lOrysASNI';

let supabase = null;
let isConnected = false;
let memoryUsers = [];

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    hash: row.hash,
    salt: row.salt,
    role: row.role || 'Security Operator',
    displayName: row.display_name || row.username,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    activeSessionId: row.active_session_id || null,
  };
}

function userToRow(user) {
  if (!user) return null;
  return {
    id: user.id,
    user_id: user.userId || user.user_id,
    username: (user.username || '').trim().toLowerCase(),
    hash: user.hash,
    salt: user.salt,
    role: user.role || 'Security Operator',
    display_name: user.displayName || user.display_name || user.username,
    created_at: user.createdAt || user.created_at || new Date().toISOString(),
    last_login_at: user.lastLoginAt || user.last_login_at || null,
    active_session_id: user.activeSessionId || user.active_session_id || null,
  };
}

function updatesToRow(updates) {
  const row = {};
  if (updates.userId !== undefined) row.user_id = updates.userId;
  if (updates.user_id !== undefined) row.user_id = updates.user_id;
  if (updates.displayName !== undefined) row.display_name = updates.displayName;
  if (updates.display_name !== undefined) row.display_name = updates.display_name;
  if (updates.lastLoginAt !== undefined) row.last_login_at = updates.lastLoginAt;
  if (updates.last_login_at !== undefined) row.last_login_at = updates.last_login_at;
  if (updates.activeSessionId !== undefined) row.active_session_id = updates.activeSessionId;
  if (updates.active_session_id !== undefined) row.active_session_id = updates.active_session_id;
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.hash !== undefined) row.hash = updates.hash;
  if (updates.salt !== undefined) row.salt = updates.salt;
  return row;
}

// Connect to Supabase
async function connectDB() {
  if (isConnected && supabase) {
    return { isConnected: true, supabase };
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Supabase credentials not configured, use local JSON fallback
    return { isConnected: false, supabase: null };
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test connection with lightweight select
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      throw error;
    }

    isConnected = true;
    console.log(`[Database] Successfully connected to Supabase: "${SUPABASE_URL}"`);

    // Sync any local users from data/users.json into Supabase if not present
    await syncLocalUsersToSupabase();

    return { isConnected: true, supabase };
  } catch (err) {
    console.warn(`[Database] Supabase connection notice (${err.message}). Using local storage fallback.`);
    isConnected = false;
    return { isConnected: false, supabase: null };
  }
}

// Sync users from users.json into Supabase upon initial connection
async function syncLocalUsersToSupabase() {
  if (!supabase || !isConnected || !fs.existsSync(USERS_FILE)) return;
  try {
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    const localUsers = JSON.parse(content);
    if (Array.isArray(localUsers)) {
      for (const u of localUsers) {
        const row = userToRow(u);
        await supabase.from('users').upsert(row, { onConflict: 'username' });
      }
    }
  } catch (e) {
    console.warn('[Database] Sync local users to Supabase notice:', e.message);
  }
}

let connectionPromise = null;

// Ensure database connection in serverless / cold-start environments
async function ensureConnected() {
  if (isConnected && supabase) return;
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  if (!connectionPromise) {
    connectionPromise = connectDB().finally(() => {
      connectionPromise = null;
    });
  }
  await connectionPromise;
}

// User Model Operations
async function findUserByUsername(username) {
  const cleanUsername = (username || '').trim().toLowerCase();
  if (!cleanUsername) return null;

  await ensureConnected();

  if (isConnected && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (!error && data) {
        return rowToUser(data);
      }
    } catch (e) {
      console.warn('[Database] Supabase findUser error, checking local fallback:', e.message);
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
  await ensureConnected();
  const row = userToRow(newUser);

  if (isConnected && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(row)
        .select()
        .maybeSingle();

      if (!error && data) {
        updateLocalFile(newUser);
        return rowToUser(data);
      }
      console.warn('[Database] Supabase insertUser warning:', error ? error.message : 'no data');
    } catch (e) {
      console.warn('[Database] Supabase insertUser error, using local fallback:', e.message);
    }
  }

  // Local file fallback
  updateLocalFile(newUser);
  return newUser;
}

async function getAllUsers() {
  await ensureConnected();
  if (isConnected && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(rowToUser);
      }
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

async function findUserById(idOrUserId) {
  if (!idOrUserId) return null;
  await ensureConnected();

  if (isConnected && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${idOrUserId},user_id.eq.${idOrUserId}`)
        .maybeSingle();

      if (!error && data) {
        return rowToUser(data);
      }
    } catch (e) {
      console.warn('[Database] Supabase findUserById error:', e.message);
    }
  }

  const users = await getAllUsers();
  return users.find(u => u.id === idOrUserId || u.userId === idOrUserId) || null;
}

async function updateUser(usernameOrId, updates) {
  if (!usernameOrId || !updates) return false;
  await ensureConnected();

  const rowUpdates = updatesToRow(updates);

  if (isConnected && supabase) {
    try {
      await supabase
        .from('users')
        .update(rowUpdates)
        .or(`username.ilike.${usernameOrId},id.eq.${usernameOrId},user_id.eq.${usernameOrId}`);
    } catch (e) {
      console.warn('[Database] Supabase updateUser error:', e.message);
    }
  }

  // Update in local cache
  const mIdx = memoryUsers.findIndex(u => u.username.toLowerCase() === usernameOrId.toLowerCase() || u.id === usernameOrId || u.userId === usernameOrId);
  if (mIdx >= 0) {
    memoryUsers[mIdx] = { ...memoryUsers[mIdx], ...updates };
  }

  try {
    if (fs.existsSync(USERS_FILE)) {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      const idx = users.findIndex(u => u.username.toLowerCase() === usernameOrId.toLowerCase() || u.id === usernameOrId || u.userId === usernameOrId);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updates };
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
      }
    }
  } catch (e) {}
  return true;
}

// Session Model Operations in Supabase
async function saveSessionToSupabase(session) {
  await ensureConnected();
  if (!isConnected || !supabase || !session) return false;
  try {
    const row = {
      id: session.id,
      user_id: session.userId || null,
      operator: session.operator || null,
      created_at: session.createdAt,
      expires_at: session.expiresAt,
      status: session.status || 'waiting',
      sleep_timer: session.sleepTimer || { active: false, expiresAt: null, durationMinutes: null },
    };
    await supabase.from('sessions').upsert(row, { onConflict: 'id' });
    return true;
  } catch (e) {
    return false;
  }
}

async function deleteSessionFromSupabase(id) {
  await ensureConnected();
  if (!isConnected || !supabase || !id) return false;
  try {
    await supabase.from('sessions').delete().eq('id', id);
    return true;
  } catch (e) {
    return false;
  }
}

async function getActiveSessionsFromSupabase() {
  await ensureConnected();
  if (!isConnected || !supabase) return [];
  try {
    const now = Date.now();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gt('expires_at', now)
      .neq('status', 'ended');

    if (!error && Array.isArray(data)) {
      return data.map(row => ({
        id: row.id,
        userId: row.user_id,
        operator: row.operator,
        createdAt: Number(row.created_at),
        expiresAt: Number(row.expires_at),
        status: row.status,
        sleepTimer: row.sleep_timer || { active: false, expiresAt: null, durationMinutes: null },
      }));
    }
  } catch (e) {}
  return [];
}

function getStatus() {
  return {
    success: true,
    mode: isConnected ? 'supabase' : 'local_fallback',
    database: isConnected ? 'supabase' : 'file_fallback',
    connected: isConnected,
    dbName: isConnected ? 'supabase_postgres' : 'local_json',
    supabaseUrl: SUPABASE_URL,
  };
}

module.exports = {
  connectDB,
  findUserByUsername,
  findUserById,
  updateUser,
  insertUser,
  getAllUsers,
  saveSessionToSupabase,
  deleteSessionFromSupabase,
  getActiveSessionsFromSupabase,
  getStatus,
  getSupabaseClient: () => supabase,
};
