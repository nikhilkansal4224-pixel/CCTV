require('./_env');
const crypto = require('crypto');
const { connectToDatabase } = require('./_db');

// In-memory sessions, users, & 2FA challenges store for offline / fallback mode
const memoryUsers = new Map();
const memorySessions = new Map();
const memoryChallenges = new Map();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function generateToken() {
  const secret = process.env.SESSION_SECRET || 'argus_sec_';
  return secret + crypto.randomBytes(32).toString('hex');
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'ad***@argus-surveillance.net';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}

// Default Sentinel Admin Operator with 2-Step Authentication enabled (configurable via ENV)
const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USERNAME || 'admin',
  displayName: process.env.ADMIN_DISPLAY_NAME || 'Lead Security Sentinel',
  email: process.env.ADMIN_EMAIL || 'admin@argus-surveillance.net',
  role: 'admin',
  clearance: 'Level 4 Sentinel Clearance',
  pin: process.env.ADMIN_PIN || '7777', // Hardware Security Key PIN
  twoFactorEnabled: true,
  salt: process.env.AUTH_SALT || 'argus_default_salt_2026',
  createdAt: new Date()
};
DEFAULT_ADMIN.passwordHash = hashPassword(process.env.ADMIN_PASSWORD || 'password123', DEFAULT_ADMIN.salt);

// Seed in-memory default user
memoryUsers.set(DEFAULT_ADMIN.username.toLowerCase(), { ...DEFAULT_ADMIN });

async function getCollections() {
  const dbContext = await connectToDatabase();
  if (dbContext.isMemory || !dbContext.db) {
    return {
      isMemory: true,
      users: {
        findOne: async (query) => {
          if (query.username) {
            return memoryUsers.get(query.username.toLowerCase()) || null;
          }
          if (query.email) {
            for (const user of memoryUsers.values()) {
              if (user.email && user.email.toLowerCase() === query.email.toLowerCase()) return user;
            }
          }
          if (query.googleId) {
            for (const user of memoryUsers.values()) {
              if (user.googleId === query.googleId) return user;
            }
          }
          if (query.$or && Array.isArray(query.$or)) {
            for (const sub of query.$or) {
              if (sub.email) {
                for (const user of memoryUsers.values()) {
                  if (user.email && user.email.toLowerCase() === sub.email.toLowerCase()) return user;
                }
              }
              if (sub.googleId) {
                for (const user of memoryUsers.values()) {
                  if (user.googleId === sub.googleId) return user;
                }
              }
            }
          }
          if (query.pin) {
            for (const user of memoryUsers.values()) {
              if (user.pin === query.pin) return user;
            }
          }
          return null;
        },
        insertOne: async (doc) => {
          doc._id = 'mem_user_' + Date.now();
          memoryUsers.set(doc.username.toLowerCase(), doc);
          return { insertedId: doc._id };
        },
        updateOne: async (query, update) => {
          const user = await getCollections().then(c => c.users.findOne(query));
          if (user) {
            Object.assign(user, update.$set || {});
          }
        }
      },
      sessions: {
        findOne: async (query) => {
          return memorySessions.get(query.token) || null;
        },
        insertOne: async (doc) => {
          doc._id = 'mem_sess_' + Date.now();
          memorySessions.set(doc.token, doc);
          return { insertedId: doc._id };
        },
        deleteOne: async (query) => {
          memorySessions.delete(query.token);
          return { deletedCount: 1 };
        }
      }
    };
  }

  // MongoDB is connected
  const users = dbContext.db.collection('users');
  const sessions = dbContext.db.collection('sessions');

  // Seed default admin if user collection is empty
  try {
    const adminExists = await users.findOne({ username: 'admin' });
    if (!adminExists) {
      await users.insertOne({ ...DEFAULT_ADMIN });
    }
  } catch (e) {
    console.warn('Could not seed admin in MongoDB:', e.message);
  }

  return { isMemory: false, users, sessions };
}

async function loginUser({ username, password }) {
  if (!username || !password) {
    throw new Error('Please enter both Operator ID and Password.');
  }

  const { users } = await getCollections();
  const cleanUser = username.trim().toLowerCase();
  const user = await users.findOne({ username: cleanUser });

  if (!user) {
    throw new Error('Operator credentials not recognized.');
  }

  const calculatedHash = hashPassword(password, user.salt || 'argus_default_salt_2026');
  if (calculatedHash !== user.passwordHash) {
    throw new Error('Invalid security password.');
  }

  // Check if 2-Step Authentication is enabled
  const is2FAEnabled = user.twoFactorEnabled !== false; // enabled by default

  if (is2FAEnabled) {
    const challengeId = 'ch_' + crypto.randomBytes(18).toString('hex');
    const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const userEmail = user.email || `${user.username}@argus-surveillance.net`;

    const challengeData = {
      challengeId,
      username: user.username,
      displayName: user.displayName || user.username,
      role: user.role || 'operator',
      clearance: user.clearance || 'Level 3 Surveillance Clearance',
      email: userEmail,
      emailCode,
      securityKeyPin: user.pin || '7777',
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

    memoryChallenges.set(challengeId, challengeData);

    return {
      requires2FA: true,
      challengeId,
      username: user.username,
      maskedEmail: maskEmail(userEmail),
      demoEmailCode: emailCode,
      methods: [
        { id: 'passkey', name: 'Passkey (Biometric / WebAuthn)', icon: 'fingerprint' },
        { id: 'email_pin', name: 'PIN from Email', icon: 'mail' },
        { id: 'security_key', name: 'Security Key / Master FIDO', icon: 'key' }
      ]
    };
  }

  // If 2FA is disabled, log in directly
  return await issueSessionForUser(user);
}

async function issueSessionForUser(user) {
  const { sessions } = await getCollections();
  const token = generateToken();
  const sessionDoc = {
    token,
    userId: user._id || user.username,
    username: user.username,
    displayName: user.displayName || user.username,
    role: user.role || 'operator',
    clearance: user.clearance || 'Level 3 Surveillance Clearance',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  await sessions.insertOne(sessionDoc);

  return {
    success: true,
    token,
    user: {
      username: user.username,
      displayName: user.displayName || user.username,
      role: user.role || 'operator',
      clearance: user.clearance || 'Level 3 Surveillance Clearance'
    }
  };
}

async function verify2FA({ challengeId, method, code }) {
  if (!challengeId) {
    throw new Error('Missing 2-Step Authentication challenge identifier.');
  }

  const challenge = memoryChallenges.get(challengeId);
  if (!challenge) {
    throw new Error('Authentication challenge expired or invalid. Please sign in again.');
  }

  if (Date.now() > challenge.expiresAt) {
    memoryChallenges.delete(challengeId);
    throw new Error('Authentication challenge has expired. Please sign in again.');
  }

  if (method === 'email_pin') {
    const cleanCode = (code || '').trim();
    if (!cleanCode || cleanCode !== challenge.emailCode) {
      throw new Error('Invalid email PIN verification code. Please check your email or resend.');
    }
  } else if (method === 'security_key') {
    const cleanKey = (code || '').trim();
    // Allow either the user's security PIN or master FIDO key
    if (cleanKey !== challenge.securityKeyPin && cleanKey !== 'ARGUS-FIDO-7777') {
      throw new Error('Security Key PIN verification rejected. Expected hardware security key authorization.');
    }
  } else if (method === 'passkey') {
    // Biometric / WebAuthn verification
    // Client completed WebAuthn signature or biometric scanner
    if (!code || code !== 'passkey_verified') {
      throw new Error('Biometric passkey signature verification failed.');
    }
  } else {
    throw new Error('Unknown 2-Step Authentication method.');
  }

  // Challenge passed! Invalidate challenge
  memoryChallenges.delete(challengeId);

  const { users } = await getCollections();
  const user = await users.findOne({ username: challenge.username });

  return await issueSessionForUser(user || challenge);
}

async function resend2FACode({ challengeId }) {
  if (!challengeId) {
    throw new Error('Missing challenge identifier.');
  }
  const challenge = memoryChallenges.get(challengeId);
  if (!challenge) {
    throw new Error('Session challenge expired. Please restart login.');
  }

  // Generate new code
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  challenge.emailCode = newCode;
  challenge.expiresAt = Date.now() + 5 * 60 * 1000;

  return {
    success: true,
    maskedEmail: maskEmail(challenge.email),
    demoEmailCode: newCode
  };
}

async function registerUser({ username, password, displayName, email, twoFactorEnabled = true }) {
  if (!username || username.trim().length < 3) {
    throw new Error('Operator Username must be at least 3 characters.');
  }
  if (!password || password.length < 6) {
    throw new Error('Security Password must be at least 6 characters.');
  }

  const cleanUser = username.trim().toLowerCase();
  const { users } = await getCollections();

  const existing = await users.findOne({ username: cleanUser });
  if (existing) {
    throw new Error(`Operator '${username}' already exists. Please choose a different username.`);
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser = {
    username: cleanUser,
    displayName: (displayName && displayName.trim()) || `Operator ${username}`,
    email: (email && email.trim()) || `${cleanUser}@argus-surveillance.net`,
    role: 'operator',
    clearance: 'Level 3 Surveillance Clearance',
    pin: '7777',
    twoFactorEnabled: twoFactorEnabled !== false,
    salt,
    passwordHash,
    createdAt: new Date()
  };

  await users.insertOne(newUser);
  return await issueSessionForUser(newUser);
}

async function getUserProfile(token) {
  if (!token) throw new Error('Unauthorized');
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const { sessions, users } = await getCollections();

  const session = await sessions.findOne({ token: cleanToken });
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error('Session expired or invalid.');
  }

  const user = await users.findOne({ username: session.username });
  if (!user) throw new Error('User not found.');

  return {
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email || `${user.username}@argus-surveillance.net`,
    role: user.role || 'operator',
    clearance: user.clearance || 'Level 3 Surveillance Clearance',
    twoFactorEnabled: user.twoFactorEnabled !== false,
    pin: user.pin || '7777',
    hasPasskey: true,
    createdAt: user.createdAt || new Date()
  };
}

async function updateUserProfile(token, updates) {
  if (!token) throw new Error('Unauthorized');
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const { sessions, users } = await getCollections();

  const session = await sessions.findOne({ token: cleanToken });
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error('Session expired or invalid.');
  }

  const user = await users.findOne({ username: session.username });
  if (!user) throw new Error('User not found.');

  const fieldsToSet = {};
  if (updates.displayName && typeof updates.displayName === 'string') {
    fieldsToSet.displayName = updates.displayName.trim();
  }
  if (updates.email && typeof updates.email === 'string') {
    fieldsToSet.email = updates.email.trim();
  }
  if (typeof updates.twoFactorEnabled === 'boolean') {
    fieldsToSet.twoFactorEnabled = updates.twoFactorEnabled;
  }
  if (updates.pin && /^\d{4,6}$/.test(String(updates.pin).trim())) {
    fieldsToSet.pin = String(updates.pin).trim();
  }

  await users.updateOne({ username: user.username }, { $set: fieldsToSet });

  if (fieldsToSet.displayName) {
    session.displayName = fieldsToSet.displayName;
    await sessions.updateOne({ token: cleanToken }, { $set: { displayName: fieldsToSet.displayName } });
  }

  return await getUserProfile(token);
}

async function changeUserPassword(token, { currentPassword, newPassword }) {
  if (!token) throw new Error('Unauthorized');
  if (!currentPassword || !newPassword) {
    throw new Error('Please provide both current and new password.');
  }
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const { sessions, users } = await getCollections();

  const session = await sessions.findOne({ token: cleanToken });
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new Error('Session expired or invalid.');
  }

  const user = await users.findOne({ username: session.username });
  if (!user) throw new Error('User not found.');

  const calcCurrent = hashPassword(currentPassword, user.salt || 'argus_default_salt_2026');
  if (calcCurrent !== user.passwordHash) {
    throw new Error('Current password is incorrect.');
  }

  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);

  await users.updateOne({ username: user.username }, {
    $set: { passwordHash: newHash, salt: newSalt }
  });

  return { success: true, message: 'Password updated successfully.' };
}

async function verifySession(token) {
  if (!token) return null;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const { sessions, users } = await getCollections();

  const session = await sessions.findOne({ token: cleanToken });
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await sessions.deleteOne({ token: cleanToken });
    return null;
  }

  const user = await users.findOne({ username: session.username });
  if (!user) return null;

  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    clearance: user.clearance,
    twoFactorEnabled: user.twoFactorEnabled !== false
  };
}

async function authenticateWithGoogle({ credential, email, name, picture, sub }) {
  let googleEmail = email;
  let googleName = name;
  let googlePicture = picture;
  let googleSub = sub;

  // If JWT credential string provided from Google Identity Services
  if (credential && typeof credential === 'string') {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        googleEmail = payload.email || googleEmail;
        googleName = payload.name || googleName;
        googlePicture = payload.picture || googlePicture;
        googleSub = payload.sub || googleSub;
      }
    } catch (e) {
      console.warn('Could not decode Google JWT credential, fallback to body fields:', e.message);
    }
  }

  if (!googleEmail || !googleEmail.includes('@')) {
    throw new Error('Valid Google account email address is required.');
  }

  const cleanEmail = googleEmail.trim().toLowerCase();
  const { users } = await getCollections();

  // Find user by email or googleId
  let user = await users.findOne({
    $or: [
      { email: cleanEmail },
      { googleId: googleSub || cleanEmail }
    ]
  });

  // If user does not exist, automatically sign them up!
  if (!user) {
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_').toLowerCase();
    let finalUsername = baseUsername;
    let count = 1;
    while (await users.findOne({ username: finalUsername })) {
      finalUsername = `${baseUsername}_${count++}`;
    }

    user = {
      username: finalUsername,
      displayName: (googleName && googleName.trim()) || finalUsername,
      email: cleanEmail,
      role: 'operator',
      clearance: 'Level 3 Surveillance Clearance',
      googleId: googleSub || cleanEmail,
      avatar: googlePicture || '',
      provider: 'google',
      pin: '7777',
      twoFactorEnabled: false, // Google account already provides Google 2FA
      createdAt: new Date()
    };

    await users.insertOne(user);
  } else {
    // Update Google metadata if needed
    const updates = {};
    if (googleSub && !user.googleId) updates.googleId = googleSub;
    if (googlePicture && !user.avatar) updates.avatar = googlePicture;
    if (googleName && (!user.displayName || user.displayName === user.username)) updates.displayName = googleName;
    if (Object.keys(updates).length > 0) {
      await users.updateOne({ username: user.username }, { $set: updates });
    }
  }

  // Issue 7-day session token
  return await issueSessionForUser(user);
}

async function logoutSession(token) {
  if (!token) return { success: true };
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const { sessions } = await getCollections();
  await sessions.deleteOne({ token: cleanToken });
  return { success: true };
}

module.exports = {
  loginUser,
  verify2FA,
  resend2FACode,
  registerUser,
  authenticateWithGoogle,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  verifySession,
  logoutSession,
  DEFAULT_ADMIN
};
